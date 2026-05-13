from __future__ import annotations

import asyncio
import json
import logging
import re
from types import SimpleNamespace
from typing import Any

from google import genai
from google.api_core import exceptions as google_api_exceptions
from google.genai import errors as genai_errors
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.tool_handlers import (
    TOOL_DEFINITIONS,
    build_system_prompt,
    execute_tool,
)
from app.models import Conversation, MessageDirection
from app.services.conversation import list_recent_messages
from app.services.effective_settings import EffectiveSettings

logger = logging.getLogger(__name__)


def gemini_quota_user_message(exc: BaseException | None = None) -> str:
    """Human-facing WhatsApp text when Gemini returns quota / 429 errors."""
    base = (
        "Gemini rechazó la petición por límites de cuota (plan gratuito o proyecto sin cupo). "
        "En Configuración prueba el modelo gemini-2.5-flash (suele tener cupo distinto a "
        "gemini-2.0-flash). Más info: https://ai.google.dev/gemini-api/docs/rate-limits "
        "— También puedes usar OpenAI en Configuración."
    )
    if exc is None:
        return base
    raw = str(exc)
    low = raw.lower()
    if "limit: 0" in low or "limit:0" in low:
        return (
            "Google respondió con cuota «limit: 0» para este modelo en tu proyecto: a veces "
            "hace falta activar facturación en Google Cloud / AI Studio (puede seguir siendo "
            "uso gratuito con límites). Prueba en Configuración el modelo gemini-2.5-flash o "
            "gemini-flash-latest. https://ai.google.dev/gemini-api/docs/rate-limits — "
            "O usa OpenAI en Configuración."
        )
    if "gemini-2.0-flash" in low and "gemini-2.5" not in low:
        return (
            "Cuota agotada o no disponible para gemini-2.0-flash en tu proyecto. "
            "En Configuración cambia el modelo a gemini-2.5-flash (recomendado ahora en API "
            "pública) o gemini-flash-latest, guarda y reintenta. "
            + base.split("—")[0].strip()
            + "."
        )
    return base


def _looks_like_quota_error(exc: BaseException) -> bool:
    if isinstance(exc, google_api_exceptions.ResourceExhausted):
        return True
    if isinstance(exc, genai_errors.ClientError) and getattr(exc, "code", None) == 429:
        return True
    low = str(exc).lower()
    return (
        "429" in low
        and (
            "resource_exhausted" in low
            or "quota" in low
            or "too many requests" in low
            or "generate_content_free_tier" in low.replace("_", "")
        )
    ) or ("quota" in low and "exceeded" in low and ("generativelanguage" in low or "gemini" in low))


def _quota_daily_exhausted(exc: BaseException) -> bool:
    """If daily free-tier cap is in the error, sleeping and retrying rarely helps."""
    return "GenerateRequestsPerDay" in str(exc)


def _retry_sleep_seconds(exc: BaseException, attempt: int, *, default_base: float = 8.0) -> float:
    """Prefer RetryInfo from API (e.g. 'retry in 48.78s') over blind exponential backoff."""
    text = str(exc)
    m = re.search(r"(?i)retry(?:\s+in)?\s+([\d.]+)\s*s", text)
    if m:
        return min(max(float(m.group(1)), 2.0), 90.0)
    return min(default_base * (2**attempt), 45.0)


async def _generate_with_quota_retry(
    client: genai.Client,
    *,
    model: str,
    contents: list[types.Content],
    config: types.GenerateContentConfig,
    max_attempts: int = 4,
) -> Any:
    """Gemini free tier often returns 429; backoff using server hint when present."""

    def call() -> Any:
        return client.models.generate_content(model=model, contents=contents, config=config)

    last: BaseException | None = None
    for attempt in range(max_attempts):
        try:
            return await asyncio.to_thread(call)
        except Exception as exc:  # noqa: BLE001
            if not _looks_like_quota_error(exc):
                raise
            last = exc
            if _quota_daily_exhausted(exc):
                logger.warning("Gemini daily quota hit; not retrying: %s", exc)
                break
            if attempt >= max_attempts - 1:
                break
            wait_s = _retry_sleep_seconds(exc, attempt)
            logger.warning(
                "Gemini quota/rate limit (%s), retry %s/%s after %.1fs",
                type(exc).__name__,
                attempt + 1,
                max_attempts,
                wait_s,
            )
            await asyncio.sleep(wait_s)
    assert last is not None
    raise last


def _build_gemini_tool() -> types.Tool:
    decls: list[types.FunctionDeclaration] = []
    for t in TOOL_DEFINITIONS:
        fn = t["function"]
        params = fn.get("parameters")
        if not isinstance(params, dict):
            params = {"type": "object", "properties": {}}
        decls.append(
            types.FunctionDeclaration(
                name=fn["name"],
                description=fn.get("description") or "",
                parameters_json_schema=params,
            )
        )
    return types.Tool(function_declarations=decls)


def _first_function_call(response: Any) -> SimpleNamespace | None:
    calls = getattr(response, "function_calls", None) or []
    if not calls:
        return None
    item = calls[0]
    inner = getattr(item, "function_call", None) or item
    name = getattr(inner, "name", None)
    args = getattr(inner, "args", None)
    if not name:
        return None
    return SimpleNamespace(name=name, args=args)


def _response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return str(text).strip()
    return ""


async def generate_with_gemini(
    session: AsyncSession,
    *,
    conversation: Conversation,
    user_text: str,
    eff: EffectiveSettings,
) -> str:
    try:
        history_msgs = await list_recent_messages(session, conversation.id, limit=24)
        pairs: list[tuple[str, str]] = []
        for m in history_msgs:
            role = "user" if m.direction == MessageDirection.inbound else "model"
            pairs.append((role, m.body))
        if not pairs or pairs[-1][0] != "user":
            pairs.append(("user", user_text))
        last_user = pairs[-1][1]
        history_pairs = pairs[:-1]

        contents: list[types.Content] = []
        for role, text in history_pairs:
            contents.append(
                types.Content(
                    role="user" if role == "user" else "model",
                    parts=[types.Part.from_text(text=text)],
                )
            )
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=last_user)]))

        tool = _build_gemini_tool()
        config = types.GenerateContentConfig(
            system_instruction=build_system_prompt(eff),
            tools=[tool],
            tool_config=types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(mode="AUTO"),
            ),
        )

        def _make_client() -> genai.Client:
            return genai.Client(api_key=eff.gemini_api_key)

        client = await asyncio.to_thread(_make_client)
        try:
            response = await _generate_with_quota_retry(
                client,
                model=eff.gemini_model,
                contents=contents,
                config=config,
            )

            for _ in range(6):
                fc = _first_function_call(response)
                if fc is None:
                    text = _response_text(response)
                    return text or "Gracias por tu mensaje. Un agente te contactará pronto."

                arg_dict: dict[str, Any] = {}
                if isinstance(fc.args, dict):
                    arg_dict = dict(fc.args)
                elif fc.args is not None:
                    try:
                        arg_dict = dict(fc.args)  # type: ignore[arg-type]
                    except (TypeError, ValueError):
                        arg_dict = {}
                raw_args = json.dumps(arg_dict)
                payload = await execute_tool(
                    session,
                    conversation=conversation,
                    tool_name=fc.name,
                    raw_arguments=raw_args,
                )
                try:
                    tool_payload: dict[str, Any] = json.loads(payload)
                except json.JSONDecodeError:
                    tool_payload = {"result": payload}

                if not response.candidates:
                    return "No pude leer la respuesta del modelo. Intenta de nuevo."
                cand = response.candidates[0].content
                if cand is None:
                    return "No pude leer la respuesta del modelo. Intenta de nuevo."

                fr_part = types.Part.from_function_response(
                    name=fc.name,
                    response=tool_payload,
                )
                contents.append(cand)
                contents.append(types.Content(role="tool", parts=[fr_part]))

                response = await _generate_with_quota_retry(
                    client,
                    model=eff.gemini_model,
                    contents=contents,
                    config=config,
                )

            return (
                "No pude completar la solicitud en este momento. Intenta de nuevo en unos minutos."
            )
        finally:

            def _close() -> None:
                client.close()

            await asyncio.to_thread(_close)
    except Exception as exc:  # noqa: BLE001
        if _looks_like_quota_error(exc):
            logger.warning("Gemini quota exhausted after retries: %s", exc)
            return gemini_quota_user_message(exc)
        raise
