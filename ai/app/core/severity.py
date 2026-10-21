"""Severity estimate from the share of leaf area that is no longer healthy green.

This is an image-analysis estimate, not a model output. Replace with a trained
severity head or lesion segmentation model once labelled severity data exists.
"""
import cv2
import numpy as np

from app.core.image import leaf_region, resize_long_side


def estimate_severity(img: np.ndarray) -> tuple[str | None, float | None]:
    work = resize_long_side(img, 512)
    leaf = leaf_region(work) > 0
    leaf_px = int(leaf.sum())
    if leaf_px == 0:
        return None, None

    h, s, _ = cv2.split(cv2.cvtColor(work, cv2.COLOR_BGR2HSV))
    healthy = (h >= 35) & (h <= 90) & (s >= 50)
    affected = leaf & ~healthy
    ratio = float(affected.sum()) / leaf_px

    if ratio < 0.10:
        level = "mild"
    elif ratio < 0.30:
        level = "moderate"
    else:
        level = "severe"
    return level, round(ratio, 3)
