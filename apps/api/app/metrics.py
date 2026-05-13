"""Métricas Prometheus (webhook y salud del pipeline)."""

from __future__ import annotations

from prometheus_client import Counter

twilio_webhook_total = Counter(
    "wsp_twilio_webhook_requests_total",
    "POST /webhooks/twilio/whatsapp",
    ("outcome",),
)

twilio_webhook_errors = Counter(
    "wsp_twilio_webhook_errors_total",
    "Errores no controlados en el webhook de Twilio",
)
