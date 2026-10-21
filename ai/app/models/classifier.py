"""ONNX image classifier loaded from a versioned model bundle.

Bundle layout (produced by `ml/` export step):
    <MODEL_DIR>/<task>/<version>/model.onnx
    <MODEL_DIR>/<task>/<version>/labels.json      ["maize__common_rust", ...]
    <MODEL_DIR>/<task>/<version>/model_card.json  {version, task, input_size, mean, std, metrics}
"""
import json
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


@dataclass
class ClassifierBundle:
    version: str
    task: str
    labels: list[str]
    input_size: int
    mean: np.ndarray
    std: np.ndarray
    session: ort.InferenceSession

    @classmethod
    def load(cls, path: Path) -> "ClassifierBundle":
        card = json.loads((path / "model_card.json").read_text())
        labels = json.loads((path / "labels.json").read_text())
        session = ort.InferenceSession(str(path / "model.onnx"), providers=ort.get_available_providers())
        return cls(
            version=card["version"],
            task=card["task"],
            labels=labels,
            input_size=int(card.get("input_size", 224)),
            mean=np.array(card.get("mean", [0.485, 0.456, 0.406]), dtype=np.float32),
            std=np.array(card.get("std", [0.229, 0.224, 0.225]), dtype=np.float32),
            session=session,
        )

    def _preprocess(self, img_bgr: np.ndarray) -> np.ndarray:
        # Must mirror the eval transform in ml/src/agroml/data/transforms.py
        size = self.input_size
        h, w = img_bgr.shape[:2]
        scale = int(size * 1.14) / min(h, w)
        img = cv2.resize(img_bgr, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]
        top, left = (h - size) // 2, (w - size) // 2
        img = img[top : top + size, left : left + size]
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        rgb = (rgb - self.mean) / self.std
        return rgb.transpose(2, 0, 1)[None, ...]

    def predict(self, img_bgr: np.ndarray, top_k: int = 3, crop: str | None = None) -> list[tuple[str, float]]:
        logits = self.session.run(None, {self.session.get_inputs()[0].name: self._preprocess(img_bgr)})[0][0]

        # If the farmer told us the crop, only consider that crop's classes.
        if crop:
            allowed = np.array([lbl.startswith(f"{crop}__") for lbl in self.labels])
            if allowed.any():
                logits = np.where(allowed, logits, -np.inf)

        exp = np.exp(logits - logits[np.isfinite(logits)].max())
        probs = exp / exp.sum()
        order = np.argsort(probs)[::-1][:top_k]
        return [(self.labels[i], float(probs[i])) for i in order if probs[i] > 0]


def find_bundle(model_dir: Path, task: str, version: str | None) -> Path | None:
    root = model_dir / task
    if not root.is_dir():
        return None
    if version:
        path = root / version
        return path if (path / "model.onnx").exists() else None
    candidates = sorted(p for p in root.iterdir() if (p / "model.onnx").exists())
    return candidates[-1] if candidates else None
