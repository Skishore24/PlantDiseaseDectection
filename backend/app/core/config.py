# app/core/config.py
import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

# Project root = Plant-Disease-Analysis/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    # ── Application ────────────────────────────
    APP_NAME: str = "Plant Disease Detection AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # 'development' | 'production'
    API_V1_STR: str = "/api/v1"

    # ── Security ───────────────────────────────
    SECRET_KEY: str = "default_secret_key_plant_disease_ai_2026_secure_key_64_chars_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Database ───────────────────────────────
    MONGO_URI: str = ""
    DATABASE_NAME: str = "plant_ai"

    # ── ML Model Paths (relative to project root) ─
    MODEL_PATH: str = "ml/output/final_plant_model.keras"
    CLASS_PATH: str = "ml/output/classes.json"

    # ── CORS ───────────────────────────────────
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
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

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / "backend" / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()