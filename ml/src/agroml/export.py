"""Export a trained run to a versioned ONNX bundle the AI service can load.

    python -m agroml.export --run runs/<version> [--min-macro-f1 0.85]

Writes ai/artifacts/<task>/<version>/{model.onnx, labels.json, model_card.json}.
Refuses to export a run that hasn't been evaluated or misses the quality bar.
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import onnxruntime as ort
import timm
import torch

from agroml.config import resolve
from agroml.data.transforms import MEAN, STD


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True, type=Path)
    ap.add_argument("--min-macro-f1", type=float, default=0.85)
    args = ap.parse_args()
    run_dir = resolve(args.run)

    metrics_path = run_dir / "metrics.json"
    if not metrics_path.exists():
        raise SystemExit("Run `agroml.evaluate` first — every deployed model needs test metrics.")
    metrics = json.loads(metrics_path.read_text())
    macro_f1 = metrics["macro"]["f1-score"]
    if macro_f1 < args.min_macro_f1:
        raise SystemExit(f"Test macro-F1 {macro_f1:.3f} is below the bar of {args.min_macro_f1}. Not exporting.")

    ckpt = torch.load(run_dir / "best.pt", map_location="cpu")
    cfg, labels, size = ckpt["config"], ckpt["labels"], ckpt["config"]["input_size"]
    model = timm.create_model(ckpt["arch"], pretrained=False, num_classes=len(labels))
    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    version = run_dir.name
    out = resolve(cfg["output"]["export_dir"]) / cfg["task"] / version
    out.mkdir(parents=True, exist_ok=True)

    dummy = torch.randn(1, 3, size, size)
    torch.onnx.export(
        model, dummy, out / "model.onnx",
        input_names=["image"], output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )

    # Parity check: ONNX must match PyTorch before we ship it.
    session = ort.InferenceSession(str(out / "model.onnx"))
    onnx_out = session.run(None, {"image": dummy.numpy()})[0]
    with torch.no_grad():
        torch_out = model(dummy).numpy()
    if not np.allclose(onnx_out, torch_out, atol=1e-3):
        raise SystemExit("ONNX output does not match PyTorch — export aborted.")

    (out / "labels.json").write_text(json.dumps(labels, indent=2))
    (out / "model_card.json").write_text(json.dumps({
        "version": version,
        "task": cfg["task"],
        "arch": ckpt["arch"],
        "input_size": size,
        "mean": MEAN,
        "std": STD,
        "labels": len(labels),
        "metrics": {
            "accuracy": metrics["accuracy"],
            "macro_f1": macro_f1,
            "macro_precision": metrics["macro"]["precision"],
            "macro_recall": metrics["macro"]["recall"],
            "test_size": metrics["test_size"],
        },
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }, indent=2))
    print(f"Exported {version} → {out}\nSet DISEASE_MODEL_VERSION={version} in ai/.env (or leave empty for latest) and restart the AI service.")


if __name__ == "__main__":
    main()
