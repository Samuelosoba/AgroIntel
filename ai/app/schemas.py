# Response contract consumed by server/src/modules/scans/ai-client.ts
from typing import Literal

from pydantic import BaseModel


class QualityIssue(BaseModel):
    code: str
    message: str


class QualityReport(BaseModel):
    usable: bool
    issues: list[QualityIssue]
    metrics: dict[str, float]


class Candidate(BaseModel):
    label: str
    confidence: float


class Prediction(BaseModel):
    top_k: list[Candidate]
    severity: Literal["mild", "moderate", "severe"] | None
    affected_ratio: float | None


class ModelInfo(BaseModel):
    version: str
    task: str


class AnalysisResponse(BaseModel):
    quality: QualityReport
    prediction: Prediction | None
    model: ModelInfo | None
