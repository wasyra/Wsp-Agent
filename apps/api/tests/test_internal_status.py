from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db
from app.main import app


@pytest.mark.asyncio
async def test_internal_status_unauthorized() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/internal/status")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_internal_status_ok() -> None:
    async def _mock_db():
        s = MagicMock()
        s.execute = AsyncMock(return_value=MagicMock())
        yield s

    app.dependency_overrides[get_db] = _mock_db
    try:
        key = os.environ.get("INTERNAL_API_KEY", "test-internal-key")
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r = await client.get("/internal/status", headers={"X-API-Key": key})
        assert r.status_code == 200
        data = r.json()
        assert data["database"] == "ok"
        assert data["api_version"] == "0.1.0"
        assert isinstance(data.get("git_commit"), str)
        assert "redis_configured" in data
    finally:
        app.dependency_overrides.pop(get_db, None)
