from fastapi import Header, HTTPException, status

from app.config import get_settings


async def verify_internal_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> None:
    """Autoriza acceso a `/internal/*` por shared secret.

    Alcance actual (**single-tenant**): cualquier llamada que presente la
    `INTERNAL_API_KEY` correcta puede leer todas las conversaciones, mensajes,
    leads y handoffs del despliegue. No hay filtro por `workspace_id`/`tenant_id`
    en las rutas `/internal/*`. Esto es aceptable mientras el panel Next.js
    actúe como **único cliente** confiable detrás del shared secret.

    Para soportar multi-tenant en el futuro hace falta:
      1. Modelar `workspace_id` en `conversations`, `leads`, etc.
      2. Emitir API keys por workspace (no una sola global).
      3. Filtrar consultas en `app/routers/internal.py` por el workspace
         resuelto desde la key.

    Si la API se expone fuera del backend del panel, asumir que cualquier
    holder de la key lee todo el tráfico de WhatsApp y todos los leads.
    """
    expected = get_settings().internal_api_key
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_API_KEY not configured",
        )
    if x_api_key and x_api_key == expected:
        return
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token == expected:
            return
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
