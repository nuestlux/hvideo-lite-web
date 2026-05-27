import os
from pathlib import Path
from typing import Dict
from pydantic import BaseModel

try:
    import yaml
except ImportError:
    yaml = None

CONFIG_PATH = Path(__file__).parent.parent / "config" / "ai_models.yaml"


class AIModelConfig(BaseModel):
    name: str
    endpoint: str
    target_country: str
    supported_vehicles: list[str] = ["car", "motorcycle", "truck"]
    supported_colors: list[str] = ["white", "black", "yellow", "blue"]


def load_ai_models(path: str | None = None) -> Dict[str, AIModelConfig]:
    config_file = Path(path) if path else CONFIG_PATH
    if not config_file.exists():
        return {}
    if yaml is None:
        return {}
    with open(config_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    models = {}
    for key, val in (data or {}).get("models", {}).items():
        models[key] = AIModelConfig(**val)
    return models


AI_MODELS: Dict[str, AIModelConfig] = load_ai_models()
