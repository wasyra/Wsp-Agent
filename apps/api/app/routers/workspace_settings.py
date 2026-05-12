from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.deps import verify_internal_api_key
from app.services.catalog_import import parse_catalog_bytes
from app.services.effective_settings import build_effective_settings, ensure_app_config_row

router = APIRouter(
    prefix="/internal/settings",
    tags=["settings"],
    dependencies=[Depends(verify_internal_api_key)],
)


class SettingsPublic(BaseModel):
    twilio_account_sid: str
    webhook_base_url: str
    twilio_validate_signature: bool
    llm_provider: str
    openai_model: str
    gemini_model: str
    twilio_auth_token_configured: bool
    openai_api_key_configured: bool
    gemini_api_key_configured: bool
    twilio_webhook_full_url: str
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


class CatalogParseOut(BaseModel):
    catalog_fragment: str
    rows_imported: int
    file_type: str


class SettingsUpdate(BaseModel):
    """Solo se actualizan campos enviados. Cadena vacía en secretos borra el valor guardado en BD (vuelve al .env)."""

    twilio_account_sid: str | None = Field(default=None)
    twilio_auth_token: str | None = Field(default=None)
    webhook_base_url: str | None = Field(default=None)
    twilio_validate_signature: bool | None = Field(default=None)
    llm_provider: Literal["openai", "gemini"] | None = Field(default=None)
    openai_api_key: str | None = Field(default=None)
    openai_model: str | None = Field(default=None)
    gemini_api_key: str | None = Field(default=None)
    gemini_model: str | None = Field(default=None)
    agent_business_summary: str | None = Field(default=None)
    agent_instructions: str | None = Field(default=None)
    agent_lead_capture: str | None = Field(default=None)
    agent_catalog: str | None = Field(default=None)
    agent_pricing_rules: str | None = Field(default=None)
    agent_shipping_zones: str | None = Field(default=None)
    agent_payment_methods: str | None = Field(default=None)
    agent_returns_warranty: str | None = Field(default=None)
    agent_faq: str | None = Field(default=None)
    agent_off_hours_message: str | None = Field(default=None)
    agent_hard_rules: str | None = Field(default=None)


def _public_from_effective(eff) -> SettingsPublic:
    prov = eff.llm_provider.lower()
    if prov not in ("openai", "gemini"):
        prov = "openai"
    return SettingsPublic(
        twilio_account_sid=eff.twilio_account_sid,
        webhook_base_url=eff.webhook_base_url,
        twilio_validate_signature=eff.twilio_validate_signature,
        llm_provider=prov,
        openai_model=eff.openai_model,
        gemini_model=eff.gemini_model,
        twilio_auth_token_configured=bool(eff.twilio_auth_token),
        openai_api_key_configured=bool(eff.openai_api_key),
        gemini_api_key_configured=bool(eff.gemini_api_key),
        twilio_webhook_full_url=eff.twilio_webhook_full_url(),
        agent_business_summary=eff.agent_business_summary,
        agent_instructions=eff.agent_instructions,
        agent_lead_capture=eff.agent_lead_capture,
        agent_catalog=eff.agent_catalog,
        agent_pricing_rules=eff.agent_pricing_rules,
        agent_shipping_zones=eff.agent_shipping_zones,
        agent_payment_methods=eff.agent_payment_methods,
        agent_returns_warranty=eff.agent_returns_warranty,
        agent_faq=eff.agent_faq,
        agent_off_hours_message=eff.agent_off_hours_message,
        agent_hard_rules=eff.agent_hard_rules,
    )


@router.get("", response_model=SettingsPublic)
async def get_workspace_settings(db: Annotated[AsyncSession, Depends(get_db)]) -> SettingsPublic:
    eff = await build_effective_settings(db)
    return _public_from_effective(eff)


@router.post("/agent-catalog/parse", response_model=CatalogParseOut)
async def parse_agent_catalog_upload(
    file: UploadFile = File(...),
) -> CatalogParseOut:
    """Convierte CSV o Excel (.xlsx) en líneas «celda | celda | …» para pegar en el catálogo del agente."""
    raw = await file.read()
    try:
        fragment, n, ft = parse_catalog_bytes(raw, file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return CatalogParseOut(catalog_fragment=fragment, rows_imported=n, file_type=ft)


@router.put("", response_model=SettingsPublic)
async def put_workspace_settings(
    body: SettingsUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SettingsPublic:
    row = await ensure_app_config_row(db)
    data = body.model_dump(exclude_unset=True)

    def norm_opt_str(v: str | None) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        return s or None

    if "twilio_account_sid" in data:
        row.twilio_account_sid = norm_opt_str(data["twilio_account_sid"])
    if "twilio_auth_token" in data:
        row.twilio_auth_token = norm_opt_str(data["twilio_auth_token"])
    if "webhook_base_url" in data:
        row.webhook_base_url = norm_opt_str(data["webhook_base_url"])
    if "openai_api_key" in data:
        row.openai_api_key = norm_opt_str(data["openai_api_key"])
    if "openai_model" in data:
        row.openai_model = norm_opt_str(data["openai_model"])
    if "gemini_api_key" in data:
        row.gemini_api_key = norm_opt_str(data["gemini_api_key"])
    if "gemini_model" in data:
        row.gemini_model = norm_opt_str(data["gemini_model"])
    if "twilio_validate_signature" in data and data["twilio_validate_signature"] is not None:
        row.twilio_validate_signature = bool(data["twilio_validate_signature"])
    if "llm_provider" in data and data["llm_provider"] is not None:
        row.llm_provider = str(data["llm_provider"]).lower()
    if "agent_business_summary" in data:
        row.agent_business_summary = norm_opt_str(data["agent_business_summary"])
    if "agent_instructions" in data:
        row.agent_instructions = norm_opt_str(data["agent_instructions"])
    if "agent_lead_capture" in data:
        row.agent_lead_capture = norm_opt_str(data["agent_lead_capture"])
    if "agent_catalog" in data:
        row.agent_catalog = norm_opt_str(data["agent_catalog"])
    if "agent_pricing_rules" in data:
        row.agent_pricing_rules = norm_opt_str(data["agent_pricing_rules"])
    if "agent_shipping_zones" in data:
        row.agent_shipping_zones = norm_opt_str(data["agent_shipping_zones"])
    if "agent_payment_methods" in data:
        row.agent_payment_methods = norm_opt_str(data["agent_payment_methods"])
    if "agent_returns_warranty" in data:
        row.agent_returns_warranty = norm_opt_str(data["agent_returns_warranty"])
    if "agent_faq" in data:
        row.agent_faq = norm_opt_str(data["agent_faq"])
    if "agent_off_hours_message" in data:
        row.agent_off_hours_message = norm_opt_str(data["agent_off_hours_message"])
    if "agent_hard_rules" in data:
        row.agent_hard_rules = norm_opt_str(data["agent_hard_rules"])

    await db.commit()
    eff = await build_effective_settings(db)
    return _public_from_effective(eff)
