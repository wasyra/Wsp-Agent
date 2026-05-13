from __future__ import annotations

import logging

from app.logging_setup import SecretRedactionFilter, _redact


def test_redacts_openai_key() -> None:
    out = _redact("error: key=sk-proj-AbCdEf0123456789AbCdEf0123456789xyz wrong")
    assert "sk-proj-" not in out
    assert "REDACTED" in out


def test_redacts_gemini_key() -> None:
    out = _redact("call failed for AIzaSyA1234567890abcdefghijklmnopqrstuvw on model x")
    assert "AIzaSyA" not in out
    assert "REDACTED" in out


def test_redacts_twilio_token_in_authorization_context() -> None:
    out = _redact("Authorization=0123456789abcdef0123456789abcdef called API")
    assert "0123456789abcdef0123456789abcdef" not in out
    assert "REDACTED" in out


def test_redacts_bearer_token() -> None:
    out = _redact("Header: Bearer abc.def.ghijklmnop_qrstuvwxyzABC1234567890 retry")
    assert "abc.def.ghijklmnop" not in out
    assert "Bearer ***REDACTED***" in out


def test_truncates_long_messages() -> None:
    payload = "a" * 5000
    out = _redact(payload)
    assert len(out) < len(payload)
    assert "truncated" in out


def test_filter_rewrites_record_msg() -> None:
    flt = SecretRedactionFilter()
    rec = logging.LogRecord(
        name="t",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="leaked key=sk-AbCdEf0123456789AbCdEf0123456789xyz",
        args=(),
        exc_info=None,
    )
    flt.filter(rec)
    assert "sk-AbCdEf" not in rec.getMessage()
