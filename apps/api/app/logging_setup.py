"""Logging: texto con request_id o JSON para agregadores (LOG_JSON=true).

Incluye un filtro de redacción que elimina patrones de secretos conocidos (Twilio Auth
Token, OpenAI/Gemini API keys) antes de que el mensaje llegue al handler, y trunca cargas
muy largas (>2000 chars) para evitar volcar payloads de WhatsApp/LLM al log.
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys

# Patrones de secretos a tachar. El orden importa: más específicos primero.
_SECRET_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    # OpenAI: sk-..., sk-proj-..., sk-svcacct-...
    (re.compile(r"sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}"), "sk-***REDACTED***"),
    # Gemini / Google AI: AIza...
    (re.compile(r"AIza[0-9A-Za-z_-]{30,}"), "AIza***REDACTED***"),
    # Twilio Auth Token: 32 hex chars contiguous. Cuidado con falsos positivos:
    # exigimos contexto típico (`token`, `auth`, `Authorization`) o separador.
    (
        re.compile(r"(?i)(auth[_-]?token|authorization)\s*[:=]\s*[A-Fa-f0-9]{32}"),
        r"\1=***REDACTED***",
    ),
    # GitHub tokens: gho_, ghp_, ghs_, ghr_ + 36 chars
    (re.compile(r"gh[oprs]_[A-Za-z0-9]{36,}"), "gh*_***REDACTED***"),
    # Bearer tokens largos en headers
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._-]{20,}"), "Bearer ***REDACTED***"),
)

_MAX_MESSAGE_CHARS = 2000


def _redact(text: str) -> str:
    out = text
    for pattern, replacement in _SECRET_PATTERNS:
        out = pattern.sub(replacement, out)
    if len(out) > _MAX_MESSAGE_CHARS:
        out = out[:_MAX_MESSAGE_CHARS] + f"... [truncated, total {len(text)} chars]"
    return out


class SecretRedactionFilter(logging.Filter):
    """Tacha patrones de secretos en `msg` y en el resultado de `getMessage()`.

    Se aplica antes de que el formateador serialice el record para que tanto el formato
    texto como el JSON salgan ya saneados.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            rendered = record.getMessage()
        except Exception:
            return True
        redacted = _redact(rendered)
        if redacted != rendered:
            record.msg = redacted
            record.args = ()
        elif len(rendered) > _MAX_MESSAGE_CHARS:
            record.msg = _redact(rendered)
            record.args = ()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exc_info"] = _redact(self.formatException(record.exc_info))
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    root = logging.getLogger()
    root.handlers.clear()
    h = logging.StreamHandler(sys.stdout)
    h.addFilter(SecretRedactionFilter())
    if os.environ.get("LOG_JSON", "").strip().lower() in ("1", "true", "yes"):
        h.setFormatter(JsonFormatter())
    else:
        h.setFormatter(logging.Formatter("%(levelname)s %(name)s [%(request_id)s] %(message)s"))
    root.addHandler(h)
    root.setLevel(level)
