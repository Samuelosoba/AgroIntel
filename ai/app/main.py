from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from app.config import settings
from app.core.image import ImageDecodeError, decode_image
from app.core.quality import check_quality
from app.core.severity import estimate_severity
from app.models.classifier import ClassifierBundle, find_bundle
from app.schemas import AnalysisResponse, Candidate, ModelInfo, Prediction

models: dict[str, ClassifierBundle] = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    path = find_bundle(settings.model_dir, "disease", settings.disease_model_version)
    if path:
        models["disease"] = ClassifierBundle.load(path)
        print(f"Loaded disease model {models['disease'].version}")
    else:
        print(f"No disease model found under {settings.model_dir / 'disease'} — /analyze will return 503")
    yield
    models.clear()


app = FastAPI(title="AgroIntel AI Service", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "ok": True,
        "models": {task: m.version for task, m in models.items()},
    }


@app.post("/v1/disease/analyze", response_model=AnalysisResponse)
async def analyze_disease(image: UploadFile = File(...), crop: str | None = Form(None)):
    try:
        img = decode_image(await image.read())
    except ImageDecodeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    quality = check_quality(img)
    model = models.get("disease")
    model_info = ModelInfo(version=model.version, task=model.task) if model else None

    if not quality.usable:
        return AnalysisResponse(quality=quality, prediction=None, model=model_info)
    if model is None:
        raise HTTPException(status_code=503, detail="Disease model not loaded")

    top_k = model.predict(img, top_k=settings.top_k, crop=crop)
    severity, ratio = (None, None)
    if top_k and not top_k[0][0].endswith("__healthy"):
        severity, ratio = estimate_severity(img)

    return AnalysisResponse(
        quality=quality,
        prediction=Prediction(
            top_k=[Candidate(label=lbl, confidence=round(p, 4)) for lbl, p in top_k],
            severity=severity,
            affected_ratio=ratio,
        ),
        model=model_info,
    )
