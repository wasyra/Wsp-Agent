import ssl
from collections.abc import AsyncGenerator
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

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


def _sync_url_for_alembic(url: str) -> str:
    u = url.strip()
    if "+asyncpg" in u:
        return u.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    return u


def _escape_percent_for_configparser(value: str) -> str:
    """Escape % so Alembic's ConfigParser does not treat %2A in passwords as interpolation."""
    return value.replace("%", "%%")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Aplica migraciones Alembic (esquema versionado) y asegura fila de configuración."""
    alembic_ini = Path(__file__).resolve().parents[2] / "alembic.ini"
    alembic_cfg = Config(str(alembic_ini))
    sync_url = _sync_url_for_alembic(settings.database_url)
    alembic_cfg.set_main_option("sqlalchemy.url", _escape_percent_for_configparser(sync_url))
    command.upgrade(alembic_cfg, "head")

    from app.services.effective_settings import ensure_app_config_row

    async with SessionLocal() as session:
        async with session.begin():
            await ensure_app_config_row(session)
