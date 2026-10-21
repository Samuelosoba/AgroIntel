import cv2
import numpy as np

from app.core.quality import check_quality
from app.core.severity import estimate_severity


def leaf_image(lesions: bool = False) -> np.ndarray:
    img = np.full((480, 480, 3), (200, 200, 200), np.uint8)
    cv2.ellipse(img, (240, 240), (180, 120), 0, 0, 360, (40, 160, 40), -1)  # green leaf (BGR)
    noise = np.random.default_rng(0).integers(0, 40, img.shape, dtype=np.uint8)
    img = cv2.add(img, noise)  # texture so it isn't "blurry"
    if lesions:
        for x in (160, 240, 320):
            cv2.circle(img, (x, 240), 40, (30, 70, 120), -1)  # brown spots
    return img


def test_clear_leaf_is_usable():
    report = check_quality(leaf_image())
    assert report.usable, report.issues


def test_dark_image_rejected():
    report = check_quality(np.full((480, 480, 3), 10, np.uint8))
    codes = {i.code for i in report.issues}
    assert "too_dark" in codes and not report.usable


def test_no_plant_rejected():
    noisy = np.random.default_rng(1).integers(100, 140, (480, 480, 3), dtype=np.uint8)
    codes = {i.code for i in check_quality(noisy).issues}
    assert "no_plant" in codes


def test_lesions_raise_severity():
    _, healthy_ratio = estimate_severity(leaf_image())
    _, sick_ratio = estimate_severity(leaf_image(lesions=True))
    assert sick_ratio > healthy_ratio
