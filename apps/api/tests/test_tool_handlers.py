from __future__ import annotations

from app.agent.tool_handlers import build_system_prompt, normalize_phone
from app.services.effective_settings import EffectiveSettings


def _minimal_effective() -> EffectiveSettings:
    return EffectiveSettings(
        twilio_account_sid="",
        twilio_auth_token="",
        webhook_base_url="http://localhost:8000",
        twilio_validate_signature=False,
        llm_provider="openai",
        openai_api_key="",
        openai_model="gpt-4o-mini",
        gemini_api_key="",
        gemini_model="gemini-2.5-flash",
        agent_business_summary="Tienda de prueba.",
        agent_instructions="Sé breve.",
        agent_lead_capture="Nombre y ciudad.",
        agent_catalog="",
        agent_pricing_rules="",
        agent_shipping_zones="",
        agent_payment_methods="",
        agent_returns_warranty="",
        agent_faq="",
        agent_off_hours_message="",
        agent_hard_rules="No inventes precios.",
    )


def test_normalize_phone_strips_whatsapp_prefix() -> None:
    assert normalize_phone("whatsapp:+51999888777") == "+51999888777"


def test_build_system_prompt_includes_sections() -> None:
    text = build_system_prompt(_minimal_effective())
    assert "Tienda de prueba" in text
    assert "No inventes precios" in text
    assert "save_lead" in text
