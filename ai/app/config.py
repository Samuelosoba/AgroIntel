from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", protected_namespaces=())

    model_dir: Path = Path("./artifacts")
    disease_model_version: str | None = None
    top_k: int = 3

    # Image quality thresholds
    min_side_px: int = 224
    blur_threshold: float = 60.0  # variance of Laplacian
    dark_threshold: float = 50.0  # mean brightness 0–255
    bright_threshold: float = 225.0
    min_plant_ratio: float = 0.15  # share of pixels that look like plant tissue


settings = Settings()
