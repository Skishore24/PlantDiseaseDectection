import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Resolve project root path
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # ── Application ────────────────────────────
    APP_NAME: str = "LeafGuard AI"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # 'development' | 'production'
    API_V1_STR: str = "/api/v1"

    # ── Security & JWT ─────────────────────────
    SECRET_KEY: str = "leafguard_ai_secret_key_2026_super_secure_random_64_characters_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Database ───────────────────────────────
    MONGO_URI: str = ""
    DATABASE_NAME: str = "leafguard_ai"

    # ── ML Model Paths (relative or absolute) ──
    MODEL_PATH: str = "backend/models/plant_disease_model.keras"
    CLASS_PATH: str = "backend/models/class_names.json"
    METRICS_PATH: str = "backend/models/model_metrics.json"
    DISEASE_INFO_PATH: str = "backend/data/disease_info.json"

    # ── Rate Limiting ──────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_ENABLED: bool = True
    REDIS_URL: str = ""  # Optional Redis backend for production

    # ── CORS ───────────────────────────────────
    ALLOWED_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            if v == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    def get_model_path(self) -> str:
        path = Path(self.MODEL_PATH)
        if path.is_absolute():
            return str(path)
        return str(BASE_DIR / path)

    def get_class_path(self) -> str:
        path = Path(self.CLASS_PATH)
        if path.is_absolute():
            return str(path)
        return str(BASE_DIR / path)

    def get_metrics_path(self) -> str:
        path = Path(self.METRICS_PATH)
        if path.is_absolute():
            return str(path)
        return str(BASE_DIR / path)

    def get_disease_info_path(self) -> str:
        path = Path(self.DISEASE_INFO_PATH)
        if path.is_absolute():
            return str(path)
        return str(BASE_DIR / path)

    model_config = SettingsConfigDict(
        env_file=(
            str(BASE_DIR / "backend" / ".env")
            if (BASE_DIR / "backend" / ".env").exists()
            else str(BASE_DIR / ".env")
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
