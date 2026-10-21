"""Train a disease classifier.

    python -m agroml.train --config configs/disease_v1.yaml

Selects the best epoch by validation macro-F1 (not accuracy — classes are imbalanced).
Writes runs/<version>/{best.pt, labels.json, history.json}.
"""
import argparse
import json
import random
from datetime import datetime

import numpy as np
import pandas as pd
import timm
import torch
from sklearn.metrics import f1_score
from torch import nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from tqdm import tqdm

from agroml.config import load_config, resolve
from agroml.data.dataset import ManifestDataset
from agroml.data.transforms import eval_transform, train_transform


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def predict(model: nn.Module, loader: DataLoader, device: str) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    ys, ps = [], []
    with torch.no_grad(), torch.autocast(device_type=device, enabled=device == "cuda"):
        for x, y in loader:
            ps.append(model(x.to(device)).argmax(1).cpu())
            ys.append(y)
    return torch.cat(ys).numpy(), torch.cat(ps).numpy()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    args = ap.parse_args()
    cfg = load_config(args.config)
    tcfg, size = cfg["train"], cfg["input_size"]
    seed_everything(tcfg["seed"])
    device = "cuda" if torch.cuda.is_available() else "cpu"

    processed = resolve(cfg["data"]["processed_dir"])
    labels = sorted(pd.read_csv(processed / "train.csv").label.unique())
    train_ds = ManifestDataset(processed / "train.csv", labels, train_transform(size))
    val_ds = ManifestDataset(processed / "val.csv", labels, eval_transform(size))

    targets = train_ds.targets()
    counts = torch.bincount(targets, minlength=len(labels)).float()
    class_weights = (counts.sum() / (len(labels) * counts.clamp(min=1))).to(device)

    sampler = None
    if tcfg["balance"] == "weighted_sampler":
        sampler = WeightedRandomSampler(class_weights.cpu()[targets], num_samples=len(targets), replacement=True)
    loader_kw = dict(batch_size=tcfg["batch_size"], num_workers=tcfg["num_workers"], pin_memory=device == "cuda")
    train_dl = DataLoader(train_ds, sampler=sampler, shuffle=sampler is None, **loader_kw)
    val_dl = DataLoader(val_ds, **loader_kw)

    model = timm.create_model(cfg["arch"], pretrained=cfg["pretrained"], num_classes=len(labels)).to(device)
    criterion = nn.CrossEntropyLoss(
        weight=class_weights if tcfg["balance"] == "class_weights" else None,
        label_smoothing=tcfg["label_smoothing"],
    )
    optimizer = torch.optim.AdamW(model.parameters(), lr=tcfg["lr"], weight_decay=tcfg["weight_decay"])
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=tcfg["lr"], total_steps=tcfg["epochs"] * len(train_dl), pct_start=0.1
    )
    scaler = torch.amp.GradScaler(enabled=device == "cuda")

    version = f"{datetime.now():%Y%m%d-%H%M}-{cfg['arch']}"
    run_dir = resolve(cfg["output"]["runs_dir"]) / version
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "labels.json").write_text(json.dumps(labels, indent=2))

    best_f1, stale, history = -1.0, 0, []
    for epoch in range(1, tcfg["epochs"] + 1):
        model.train()
        total = 0.0
        for x, y in tqdm(train_dl, desc=f"epoch {epoch}", leave=False):
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device, enabled=device == "cuda"):
                loss = criterion(model(x), y)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            total += loss.item() * len(y)

        y_true, y_pred = predict(model, val_dl, device)
        macro_f1 = f1_score(y_true, y_pred, average="macro")
        acc = float((y_true == y_pred).mean())
        history.append({"epoch": epoch, "train_loss": total / len(train_ds), "val_acc": acc, "val_macro_f1": macro_f1})
        print(f"epoch {epoch}: loss {total / len(train_ds):.4f}  val acc {acc:.4f}  val macro-F1 {macro_f1:.4f}")

        if macro_f1 > best_f1:
            best_f1, stale = macro_f1, 0
            torch.save({"state_dict": model.state_dict(), "arch": cfg["arch"], "labels": labels, "config": cfg}, run_dir / "best.pt")
        else:
            stale += 1
            if stale >= tcfg["early_stop_patience"]:
                print("Early stopping")
                break

    (run_dir / "history.json").write_text(json.dumps(history, indent=2))
    print(f"\nBest val macro-F1 {best_f1:.4f}. Run saved to {run_dir}")
    print(f"Next: python -m agroml.evaluate --run {run_dir}")


if __name__ == "__main__":
    main()
