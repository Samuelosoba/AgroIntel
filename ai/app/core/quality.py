"""Pre-flight checks so the model is never asked to diagnose an unusable photo."""
import cv2
import numpy as np

from app.config import settings
from app.core.image import plant_mask, resize_long_side
from app.schemas import QualityIssue, QualityReport


def check_quality(img: np.ndarray) -> QualityReport:
    issues: list[QualityIssue] = []
    h, w = img.shape[:2]

    if min(h, w) < settings.min_side_px:
        issues.append(QualityIssue(code="too_small", message="The photo is too small. Move closer or use a higher camera resolution."))

    work = resize_long_side(img, 512)
    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)

    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if sharpness < settings.blur_threshold:
        issues.append(QualityIssue(code="blurry", message="The photo is blurry. Hold the phone steady and tap the leaf to focus."))

    brightness = float(gray.mean())
    if brightness < settings.dark_threshold:
        issues.append(QualityIssue(code="too_dark", message="The photo is too dark. Take it in daylight or move out of the shade."))
    elif brightness > settings.bright_threshold:
        issues.append(QualityIssue(code="too_bright", message="The photo is overexposed. Avoid direct sun glare on the leaf."))

    plant_ratio = float((plant_mask(work) > 0).mean())
    if plant_ratio < settings.min_plant_ratio:
        issues.append(QualityIssue(
            code="no_plant",
            message="We can't see enough of a leaf. Fill most of the frame with the affected leaf.",
        ))

    return QualityReport(
        usable=not issues,
        issues=issues,
        metrics={
            "width": float(w),
            "height": float(h),
            "sharpness": round(sharpness, 2),
            "brightness": round(brightness, 2),
            "plant_ratio": round(plant_ratio, 3),
        },
    )
