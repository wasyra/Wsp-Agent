from __future__ import annotations

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.request_validator import RequestValidator

from app.services.effective_settings import build_effective_settings


async def validate_twilio_request_async(
    request: Request,
    form_dict: dict[str, str],
    session: AsyncSession,
) -> bool:
    eff = await build_effective_settings(session)
    if not eff.twilio_validate_signature:
        return True
    token = eff.twilio_auth_token
    if not token:
        return False
    signature = request.headers.get("X-Twilio-Signature") or ""
    validator = RequestValidator(token)
    url = eff.twilio_webhook_full_url()
    return bool(validator.validate(url, form_dict, signature))
