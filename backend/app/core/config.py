"""Application configuration.

Every value is read lazily (on attribute access, never at import time) so the
process can boot and answer ``/api/health`` even before configuration is
provided. Secrets have no literal default in this repository — ``JWT_SECRET`` is
rolled per run and declared as ``generate`` in ``RUN.json``.
"""

import os

# ruff: noqa: N802 — the setting names mirror the environment-variable contract
# (DATABASE_URL, JWT_SECRET, ...) shared across the whole sprint.


class Settings:
    @property
    def DATABASE_URL(self) -> str:
        return os.environ.get("DATABASE_URL", "sqlite:///./dev.db")

    @property
    def JWT_SECRET(self) -> str:
        return os.environ.get("JWT_SECRET", "")

    @property
    def JWT_EXPIRES_MINUTES(self) -> int:
        return int(os.environ.get("JWT_EXPIRES_MINUTES", "60"))

    @property
    def UPLOAD_DIR(self) -> str:
        return os.environ.get("UPLOAD_DIR", "uploads")

    @property
    def MAX_IMAGE_SIZE(self) -> int:
        return int(os.environ.get("MAX_IMAGE_SIZE", str(5 * 1024 * 1024)))

    @property
    def CORS_ORIGIN(self) -> str:
        return os.environ.get("CORS_ORIGIN", "http://localhost:5173")


settings = Settings()
