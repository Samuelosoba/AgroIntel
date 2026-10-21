from pathlib import Path
from typing import Any

import yaml

ML_ROOT = Path(__file__).resolve().parents[2]


def load_config(path: str | Path) -> dict[str, Any]:
    with open(path) as f:
        return yaml.safe_load(f)


def resolve(p: str | Path) -> Path:
    """Paths in configs are relative to the ml/ folder."""
    p = Path(p)
    return p if p.is_absolute() else ML_ROOT / p
