"""Evaluate a run on the held-out test split.

    python -m agroml.evaluate --run runs/<version>

Reports accuracy, macro/weighted precision-recall-F1, per-class metrics and a
confusion matrix. Writes runs/<version>/{metrics.json, confusion_matrix.png}.
"""
import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import timm
import torch
from sklearn.metrics import ConfusionMatrixDisplay, classification_report, confusion_matrix
from torch.utils.data import DataLoader

from agroml.config import resolve
from agroml.data.dataset import ManifestDataset
from agroml.data.transforms import eval_transform
from agroml.train import predict


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True, type=Path)
    args = ap.parse_args()
    run_dir = resolve(args.run)
    ckpt = torch.load(run_dir / "best.pt", map_location="cpu")
    cfg, labels = ckpt["config"], ckpt["labels"]
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = timm.create_model(ckpt["arch"], pretrained=False, num_classes=len(labels))
    model.load_state_dict(ckpt["state_dict"])
    model.to(device)

    test_ds = ManifestDataset(resolve(cfg["data"]["processed_dir"]) / "test.csv", labels, eval_transform(cfg["input_size"]))
    y_true, y_pred = predict(model, DataLoader(test_ds, batch_size=64), device)

    report = classification_report(y_true, y_pred, labels=range(len(labels)), target_names=labels, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=range(len(labels)))
    metrics = {
        "accuracy": report["accuracy"],
        "macro": report["macro avg"],
        "weighted": report["weighted avg"],
        "per_class": {lbl: report[lbl] for lbl in labels},
        "confusion_matrix": cm.tolist(),
        "test_size": len(test_ds),
    }
    (run_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print(classification_report(y_true, y_pred, labels=range(len(labels)), target_names=labels, zero_division=0))
    weak = [lbl for lbl in labels if report[lbl]["f1-score"] < 0.8]
    if weak:
        print(f"Classes below 0.80 F1 — collect more field images for: {', '.join(weak)}")

    fig, ax = plt.subplots(figsize=(max(8, len(labels) * 0.6),) * 2)
    ConfusionMatrixDisplay(cm, display_labels=labels).plot(ax=ax, xticks_rotation=90, colorbar=False)
    fig.tight_layout()
    fig.savefig(run_dir / "confusion_matrix.png", dpi=150)
    print(f"\nSaved metrics to {run_dir}. Next: python -m agroml.export --run {run_dir}")


if __name__ == "__main__":
    main()
