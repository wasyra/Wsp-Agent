from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urljoin

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import AppConfiguration

ROW_ID = 1


def webhook_path() -> str:
    return "/webhooks/twilio/whatsapp"


@dataclass(frozen=True)
class EffectiveSettings:
    twilio_account_sid: str
    twilio_auth_token: str
    webhook_base_url: str
    twilio_validate_signature: bool
    llm_provider: str
    openai_api_key: str
    openai_model: str
    gemini_api_key: str
    gemini_model: str
    agent_business_summary: str
    agent_instructions: str
    agent_lead_capture: str
    agent_catalog: str
    agent_pricing_rules: str
    agent_shipping_zones: str
    agent_payment_methods: str
    agent_returns_warranty: str
    agent_faq: str
    agent_off_hours_message: str
    agent_hard_rules: str

    def twilio_webhook_full_url(self) -> str:
        base = self.webhook_base_url.rstrip("/") + "/"
        return urljoin(base, webhook_path().lstrip("/"))


def _text(db_val: str | None, env_val: str) -> str:
    if db_val is not None and str(db_val).strip():
        return str(db_val).strip()
    return (env_val or "").strip()


def _bool(db_val: bool | None, env_val: bool) -> bool:
    if db_val is not None:
        return bool(db_val)
    return bool(env_val)


async def get_app_config_row(session: AsyncSession) -> AppConfiguration | None:
    return await session.get(AppConfiguration, ROW_ID)


async def ensure_app_config_row(session: AsyncSession) -> AppConfiguration:
    row = await session.get(AppConfiguration, ROW_ID)
    if row is None:
        row = AppConfiguration(id=ROW_ID)
        session.add(row)
        await session.flush()
    return row


def _provider(db_val: str | None, env_val: str) -> str:
    raw = _text(db_val, env_val).lower()
    if raw in ("openai", "gemini"):
        return raw
    return "openai"


async def build_effective_settings(session: AsyncSession) -> EffectiveSettings:
    env = get_settings()
    row = await get_app_config_row(session)
    model_default = "gpt-4o-mini"
    openai_model = _text(row.openai_model if row else None, env.openai_model) or model_default
    gemini_default = "gemini-2.5-flash"
    gemini_model = _text(row.gemini_model if row else None, env.gemini_model) or gemini_default
    return EffectiveSettings(
        twilio_account_sid=_text(row.twilio_account_sid if row else None, env.twilio_account_sid),
        twilio_auth_token=_text(row.twilio_auth_token if row else None, env.twilio_auth_token),
        webhook_base_url=_text(row.webhook_base_url if row else None, env.webhook_base_url),
        twilio_validate_signature=_bool(
            row.twilio_validate_signature if row else None,
            env.twilio_validate_signature,
        ),
        llm_provider=_provider(row.llm_provider if row else None, env.llm_provider),
        openai_api_key=_text(row.openai_api_key if row else None, env.openai_api_key),
        openai_model=openai_model,
        gemini_api_key=_text(row.gemini_api_key if row else None, env.gemini_api_key),
        gemini_model=gemini_model,
        agent_business_summary=_text(
            row.agent_business_summary if row else None,
            env.agent_business_summary,
        ),
        agent_instructions=_text(row.agent_instructions if row else None, env.agent_instructions),
        agent_lead_capture=_text(row.agent_lead_capture if row else None, env.agent_lead_capture),
        agent_catalog=_text(row.agent_catalog if row else None, env.agent_catalog),
        agent_pricing_rules=_text(
            row.agent_pricing_rules if row else None, env.agent_pricing_rules
        ),
        agent_shipping_zones=_text(
            row.agent_shipping_zones if row else None, env.agent_shipping_zones
        ),
        agent_payment_methods=_text(
            row.agent_payment_methods if row else None, env.agent_payment_methods
        ),
        agent_returns_warranty=_text(
            row.agent_returns_warranty if row else None,
            env.agent_returns_warranty,
        ),
        agent_faq=_text(row.agent_faq if row else None, env.agent_faq),
        agent_off_hours_message=_text(
            row.agent_off_hours_message if row else None,
            env.agent_off_hours_message,
        ),
        agent_hard_rules=_text(row.agent_hard_rules if row else None, env.agent_hard_rules),
    )
