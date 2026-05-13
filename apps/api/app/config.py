from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase Session pooler (postgresql+asyncpg://...). Obligatorio en .env — ver README.
    database_url: str

    # Solo si TLS falla (p. ej. antivirus/proxy con certificado propio). En producción dejar true.
    database_ssl_verify: bool = True

    @field_validator("database_url", mode="before")
    @classmethod
    def database_url_non_empty(cls, v: object) -> object:
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError(
                "DATABASE_URL debe estar definida (URI Session pooler de Supabase, postgresql+asyncpg://...). "
                "Ver README."
            )
        return v

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_validate_signature: bool = True
    webhook_base_url: str = "http://localhost:8000"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    llm_provider: str = "openai"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    agent_business_summary: str = ""
    agent_instructions: str = ""
    agent_lead_capture: str = ""
    agent_catalog: str = ""
    agent_pricing_rules: str = ""
    agent_shipping_zones: str = ""
    agent_payment_methods: str = ""
    agent_returns_warranty: str = ""
    agent_faq: str = ""
    agent_off_hours_message: str = ""
    agent_hard_rules: str = ""

    internal_api_key: str = "dev-internal-key"

    cors_origins: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def cors_origin_list() -> list[str]:
    raw = get_settings().cors_origins.strip()
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]
