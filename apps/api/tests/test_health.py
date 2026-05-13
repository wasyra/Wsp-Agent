from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_via_asgi() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_ready_via_asgi() -> None:
    """Ejecuta lifespan (init_db); requiere DATABASE_URL accesible (p. ej. Postgres en CI)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health/ready")
    assert r.status_code in (200, 503)
    data = r.json()
    assert "status" in data
    if r.status_code == 200:
        assert data.get("database") == "ok"
