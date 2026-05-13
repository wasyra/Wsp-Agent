import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.config import cors_origin_list
from app.db.session import engine, init_db
from app.logging_setup import configure_logging
from app.middleware.correlation_id import CorrelationIdMiddleware, RequestIdLogFilter
from app.rate_limit import limiter
from app.routers import internal, workspace_settings
from app.webhooks import twilio_whatsapp

configure_logging()
for _handler in logging.root.handlers:
    _handler.addFilter(RequestIdLogFilter())


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield
    await engine.dispose()


app = FastAPI(title="WhatsApp Agent API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(CorrelationIdMiddleware)

app.include_router(twilio_whatsapp.router)
app.include_router(internal.router)
app.include_router(workspace_settings.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", response_model=None)
async def health_ready():
    """Comprueba conexión a Postgres (útil en orquestadores / balanceadores)."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).exception("health_ready database check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "error", "detail": str(exc)[:240]},
        )
    return {"status": "ready", "database": "ok"}


@app.get("/metrics")
async def prometheus_metrics() -> Response:
    """Prometheus scrape (restringir en red en producción)."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
