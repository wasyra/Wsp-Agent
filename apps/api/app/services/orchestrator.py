from __future__ import annotations

import html
import logging
from typing import Any

from openai import RateLimitError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.gemini_agent import _looks_like_quota_error, gemini_quota_user_message
from app.agent.tool_handlers import generate_assistant_reply
from app.models import MessageDirection
from app.services.conversation import (
    add_message,
    get_inbound_by_twilio_sid,
    get_or_create_conversation,
)

logger = logging.getLogger(__name__)


def twiml_message(text: str) -> str:
    trimmed = (text or "")[:1500]
    safe = html.escape(trimmed, quote=True)
    return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{safe}</Message></Response>'


def twiml_empty() -> str:
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


async def process_inbound_whatsapp(session: AsyncSession, form: dict[str, Any]) -> str:
    message_sid = str(form.get("MessageSid") or "")
    from_ = str(form.get("From") or "")
    to_ = str(form.get("To") or "")
    body = str(form.get("Body") or "")
    account_sid = str(form.get("AccountSid") or "") or None

    if not from_ or not to_:
        return twiml_empty()

    if message_sid:
        existing = await get_inbound_by_twilio_sid(session, message_sid)
        if existing:
            return twiml_empty()

    conv = await get_or_create_conversation(
        session,
        twilio_from=from_,
        twilio_to=to_,
        account_sid=account_sid,
    )

    try:
        await add_message(
            session,
            conversation_id=conv.id,
            direction=MessageDirection.inbound,
            body=body,
            twilio_message_sid=message_sid or None,
        )
    except IntegrityError:
        return twiml_empty()

    try:
        reply = await generate_assistant_reply(session, conversation=conv, user_text=body)
        conv.last_agent_llm_status = "ok"
        conv.last_agent_llm_error = None
    except RateLimitError as exc:
        logger.warning("OpenAI rate limit conversation_id=%s: %s", conv.id, exc)
        reply = (
            "El servicio de IA está temporalmente saturado. Intenta de nuevo en unos minutos; "
            "un asesor también puede ayudarte."
        )
        conv.last_agent_llm_status = "error"
        conv.last_agent_llm_error = str(exc)[:900]
    except Exception as exc:  # noqa: BLE001
        if _looks_like_quota_error(exc):
            logger.warning("LLM quota conversation_id=%s: %s", conv.id, exc)
            reply = gemini_quota_user_message(exc)
        else:
            logger.exception("generate_assistant_reply failed conversation_id=%s", conv.id)
            reply = (
                "Disculpa, tuvimos un problema técnico al generar la respuesta. "
                "Un asesor humano revisará tu mensaje y te contactará pronto."
            )
        conv.last_agent_llm_status = "error"
        conv.last_agent_llm_error = str(exc)[:900]
    await add_message(
        session,
        conversation_id=conv.id,
        direction=MessageDirection.outbound,
        body=reply,
        twilio_message_sid=None,
    )
    await session.flush()
    return twiml_message(reply)
