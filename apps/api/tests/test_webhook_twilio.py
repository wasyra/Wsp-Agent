from __future__ import annotations

import uuid
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_metrics_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/metrics")
    assert r.status_code == 200
    assert "twilio_webhook" in r.text or "python_gc" in r.text


@pytest.mark.asyncio
async def test_twilio_webhook_forbidden_when_signature_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def bad_validate(*_a: Any, **_k: Any) -> bool:
        return False

    monkeypatch.setattr(
        "app.webhooks.twilio_whatsapp.validate_twilio_request_async",
        bad_validate,
    )
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/webhooks/twilio/whatsapp",
            data={
                "From": "whatsapp:+1",
                "To": "whatsapp:+2",
                "Body": "hola",
                "MessageSid": "SMxx1",
            },
        )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_twilio_webhook_success_mocked_pipeline(monkeypatch: pytest.MonkeyPatch) -> None:
    async def ok_validate(*_a: Any, **_k: Any) -> bool:
        return True

    async def fake_process(_session: Any, _form: dict[str, Any]) -> str:
        return '<?xml version="1.0" encoding="UTF-8"?><Response><Message>ok</Message></Response>'

    monkeypatch.setattr(
        "app.webhooks.twilio_whatsapp.validate_twilio_request_async",
        ok_validate,
    )
    monkeypatch.setattr(
        "app.webhooks.twilio_whatsapp.process_inbound_whatsapp",
        fake_process,
    )
    sid = f"SM{uuid.uuid4().hex[:24]}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/webhooks/twilio/whatsapp",
            data={"From": "whatsapp:+99", "To": "whatsapp:+88", "Body": "hola", "MessageSid": sid},
        )
    assert r.status_code == 200
    assert "Message" in r.text
