from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.db.base import Base

settings = get_settings()
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)
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
