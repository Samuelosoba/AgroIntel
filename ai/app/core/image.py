import cv2
import numpy as np


class ImageDecodeError(ValueError):
    pass


def decode_image(data: bytes) -> np.ndarray:
    """Decode uploaded bytes into a BGR image, honouring EXIF orientation."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ImageDecodeError("Could not read the image file")
    return img


def resize_long_side(img: np.ndarray, size: int) -> np.ndarray:
    h, w = img.shape[:2]
    scale = size / max(h, w)
    if scale >= 1:
        return img
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def plant_mask(img: np.ndarray) -> np.ndarray:
    """Pixels that look like leaf tissue — green, yellow or brown, reasonably saturated."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    mask = ((h >= 8) & (h <= 95) & (s >= 40) & (v >= 35)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    return cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)


def leaf_region(img: np.ndarray) -> np.ndarray:
    """Plant mask with holes filled, so dark lesions inside a leaf count as leaf."""
    mask = plant_mask(img)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(mask)
    min_area = 0.01 * mask.size
    big = [c for c in contours if cv2.contourArea(c) >= min_area]
    cv2.drawContours(filled, big, -1, 255, thickness=cv2.FILLED)
    return filled
