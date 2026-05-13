"""Logging: texto con request_id o JSON para agregadores (LOG_JSON=true)."""

from __future__ import annotations

import json
import logging
import os
import sys


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        payload: dict = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    root = logging.getLogger()
    root.handlers.clear()
    h = logging.StreamHandler(sys.stdout)
    if os.environ.get("LOG_JSON", "").strip().lower() in ("1", "true", "yes"):
        h.setFormatter(JsonFormatter())
    else:
        h.setFormatter(logging.Formatter("%(levelname)s %(name)s [%(request_id)s] %(message)s"))
    root.addHandler(h)
    root.setLevel(level)
