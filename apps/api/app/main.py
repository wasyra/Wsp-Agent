from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import cors_origin_list
from app.db.session import engine, init_db
from app.routers import internal, workspace_settings
from app.webhooks import twilio_whatsapp


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield
    await engine.dispose()


app = FastAPI(title="WhatsApp Agent API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(twilio_whatsapp.router)
app.include_router(internal.router)
app.include_router(workspace_settings.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
