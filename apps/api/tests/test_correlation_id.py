from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_response_includes_x_request_id() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    rid = r.headers.get("X-Request-ID") or r.headers.get("x-request-id")
    assert rid
    assert len(rid) >= 8


@pytest.mark.asyncio
async def test_client_can_pass_x_request_id() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health", headers={"X-Request-ID": "trace-from-client-99"})
    assert r.status_code == 200
    assert r.headers.get("X-Request-ID") == "trace-from-client-99"
