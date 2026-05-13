import ssl
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.db.base import Base

settings = get_settings()


def _asyncpg_connect_args(database_url: str, ssl_verify: bool) -> dict | None:
    """Supabase (y otros Postgres en la nube) exigen TLS; asyncpg no siempre lo infiere del URL."""
    if "supabase.co" in database_url or "pooler.supabase.com" in database_url:
        if ssl_verify:
            return {"ssl": ssl.create_default_context()}
        insecure = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        insecure.check_hostname = False
        insecure.verify_mode = ssl.CERT_NONE
        return {"ssl": insecure}
    return None


_engine_kwargs: dict = {"echo": False, "pool_pre_ping": True}
_ca = _asyncpg_connect_args(settings.database_url, settings.database_ssl_verify)
if _ca:
    _engine_kwargs["connect_args"] = _ca

engine = create_async_engine(settings.database_url, **_engine_kwargs)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_APP_CONFIGURATION_ALTER = (
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(16)",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS gemini_api_key TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS gemini_model VARCHAR(64)",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_business_summary TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_instructions TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_lead_capture TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_catalog TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_pricing_rules TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_shipping_zones TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_payment_methods TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_returns_warranty TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_faq TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_off_hours_message TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_hard_rules TEXT",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS internal_notes TEXT",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS internal_tags JSONB",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_agent_llm_status VARCHAR(16) DEFAULT 'ok'",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_agent_llm_error TEXT",
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in _APP_CONFIGURATION_ALTER:
            await conn.execute(text(stmt))
    from app.services.effective_settings import ensure_app_config_row

    async with SessionLocal() as session:
        async with session.begin():
            await ensure_app_config_row(session)
