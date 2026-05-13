"""Límite de peticiones para endpoints públicos (p. ej. webhook Twilio)."""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_redis_url = os.environ.get("REDIS_URL", "").strip()

if _redis_url:
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[],
        storage_uri=_redis_url,
    )
else:
    limiter = Limiter(key_func=get_remote_address, default_limits=[])
