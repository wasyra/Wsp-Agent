"""Asegura variables mínimas antes de importar la app (DATABASE_URL es obligatoria en Settings)."""

from __future__ import annotations

import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/postgres",
)
os.environ.setdefault("INTERNAL_API_KEY", "test-internal-key")
