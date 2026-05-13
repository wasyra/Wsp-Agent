"""Request correlation ID: contextvar + middleware + logging filter."""

from __future__ import annotations

import contextvars
import logging
import uuid
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
# Some proxies / clients use this name; accept either.
ALT_REQUEST_ID_HEADER = "X-Correlation-ID"

request_id_ctx: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id",
    default=None,
)


class RequestIdLogFilter(logging.Filter):
    """Injects ``request_id`` on log records for format strings."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        rid = request_id_ctx.get()
        record.request_id = rid if rid else "-"
        return True


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Assigns a request id (client header or UUID), exposes on response and in logs."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        incoming = (
            request.headers.get(REQUEST_ID_HEADER)
            or request.headers.get(ALT_REQUEST_ID_HEADER)
            or ""
        ).strip()
        rid = incoming[:128] if incoming else str(uuid.uuid4())
        token = request_id_ctx.set(rid)
        request.state.request_id = rid
        try:
            response = await call_next(request)
        finally:
            request_id_ctx.reset(token)
        response.headers[REQUEST_ID_HEADER] = rid
        return response
