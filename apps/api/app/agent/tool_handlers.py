from __future__ import annotations

import json
import time
import uuid
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.effective_settings import EffectiveSettings, build_effective_settings
from app.models import (
    Conversation,
    ConversationStatus,
    Handoff,
    HandoffStatus,
    Lead,
    MessageDirection,
    ToolInvocation,
)


def normalize_phone(value: str) -> str:
    return value.removeprefix("whatsapp:").strip()


class SaveLeadArgs(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    notes: str | None = None
    score: int | None = Field(default=None, ge=0, le=100)
    company: str | None = None
    city: str | None = None
    service_or_product: str | None = None
    budget_range: str | None = None


class GetLeadArgs(BaseModel):
    phone: str


class HandoffArgs(BaseModel):
    reason: str = ""


TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "save_lead",
            "description": (
                "Obligatorio para persistir el contacto de ESTE chat en el CRM del panel. "
                "Crea o actualiza el lead de la conversación actual. "
                "Llámala en cuanto tengas datos nuevos (nombre, email, ciudad en Perú/LATAM, empresa, "
                "producto/servicio, presupuesto, notas). Puedes llamarla varias veces: cada llamada "
                "fusiona campos y qualification con lo ya guardado. "
                "Si solo charlan sin datos, no hace falta. No inventes datos."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Nombre del contacto si lo dio."},
                    "email": {"type": "string", "description": "Correo para cotización o comprobante."},
                    "phone": {
                        "type": "string",
                        "description": "Número E.164 o con prefijo whatsapp:; omite para usar el del chat.",
                    },
                    "notes": {
                        "type": "string",
                        "description": "Resumen libre: urgencia, distrito, RUC, forma de pago, etc.",
                    },
                    "score": {
                        "type": "integer",
                        "description": "Lead quality score from 0 (low) to 100 (high).",
                    },
                    "company": {"type": "string", "description": "Empresa o razón social si aplica."},
                    "city": {
                        "type": "string",
                        "description": "Ciudad o distrito (ej. Lima, Miraflores, Arequipa).",
                    },
                    "service_or_product": {
                        "type": "string",
                        "description": "Qué producto, línea o servicio le interesa.",
                    },
                    "budget_range": {
                        "type": "string",
                        "description": "Presupuesto aproximado en soles o rango que mencionó.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_lead_by_phone",
            "description": (
                "Busca si ya hay lead guardado para un número (E.164 o prefijo whatsapp:). "
                "Útil al iniciar ventas para no preguntar de nuevo lo ya conocido."
            ),
            "parameters": {
                "type": "object",
                "properties": {"phone": {"type": "string"}},
                "required": ["phone"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "request_human_handoff",
            "description": (
                "Pasa la conversación a un humano del negocio. Úsalo si piden persona, reclamo fuerte "
                "o tema fuera de alcance."
            ),
            "parameters": {
                "type": "object",
                "properties": {"reason": {"type": "string"}},
            },
        },
    },
]


async def _log_tool(
    session: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    tool_name: str,
    arguments: dict | None,
    result: dict | None,
    error: str | None,
    duration_ms: int | None,
) -> None:
    session.add(
        ToolInvocation(
            conversation_id=conversation_id,
            tool_name=tool_name,
            arguments=arguments,
            result=result,
            error=error,
            duration_ms=duration_ms,
        )
    )


def _qualification_patch(parsed: SaveLeadArgs) -> dict[str, Any] | None:
    q: dict[str, Any] = {}
    if parsed.notes:
        q["notes"] = parsed.notes
    if parsed.score is not None:
        q["score"] = parsed.score
    if parsed.company:
        q["company"] = parsed.company.strip()
    if parsed.city:
        q["city"] = parsed.city.strip()
    if parsed.service_or_product:
        q["service_or_product"] = parsed.service_or_product.strip()
    if parsed.budget_range:
        q["budget_range"] = parsed.budget_range.strip()
    return q or None


async def _save_lead(
    session: AsyncSession, conversation: Conversation, args: dict[str, Any]
) -> dict[str, Any]:
    parsed = SaveLeadArgs.model_validate(args)
    phone = normalize_phone(parsed.phone or conversation.twilio_from)
    stmt = select(Lead).where(Lead.conversation_id == conversation.id)
    result = await session.execute(stmt)
    lead = result.scalar_one_or_none()
    qual = _qualification_patch(parsed)
    if lead:
        if parsed.name:
            lead.name = parsed.name
        if parsed.email:
            lead.email = parsed.email
        lead.phone = phone
        if qual is not None:
            merged = dict(lead.qualification or {})
            merged.update(qual)
            lead.qualification = merged
        await session.flush()
        return {"ok": True, "lead_id": str(lead.id), "updated": True}
    lead = Lead(
        conversation_id=conversation.id,
        phone=phone,
        email=parsed.email,
        name=parsed.name,
        qualification=qual,
        stage="new",
    )
    session.add(lead)
    await session.flush()
    return {"ok": True, "lead_id": str(lead.id), "updated": False}


async def _get_lead_by_phone(session: AsyncSession, args: dict[str, Any]) -> dict[str, Any]:
    parsed = GetLeadArgs.model_validate(args)
    needle = normalize_phone(parsed.phone)
    stmt = select(Lead).where(Lead.phone == needle)
    result = await session.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        return {"found": False}
    return {
        "found": True,
        "lead_id": str(lead.id),
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "stage": lead.stage,
        "qualification": lead.qualification,
    }


async def _request_handoff(
    session: AsyncSession, conversation: Conversation, args: dict[str, Any]
) -> dict[str, Any]:
    parsed = HandoffArgs.model_validate(args)
    session.add(
        Handoff(
            conversation_id=conversation.id,
            reason=parsed.reason or "user_requested",
            status=HandoffStatus.pending,
        )
    )
    conversation.status = ConversationStatus.handed_off
    await session.flush()
    return {"ok": True, "status": "handed_off"}


async def execute_tool(
    session: AsyncSession,
    *,
    conversation: Conversation,
    tool_name: str,
    raw_arguments: str,
) -> str:
    started = time.perf_counter()
    args: dict[str, Any] = {}
    try:
        args = json.loads(raw_arguments or "{}")
    except json.JSONDecodeError:
        duration_ms = int((time.perf_counter() - started) * 1000)
        await _log_tool(
            session,
            conversation_id=conversation.id,
            tool_name=tool_name,
            arguments=None,
            result=None,
            error="invalid_json_arguments",
            duration_ms=duration_ms,
        )
        return json.dumps({"ok": False, "error": "invalid_json_arguments"})

    result: dict[str, Any] | None = None
    err: str | None = None
    try:
        if tool_name == "save_lead":
            result = await _save_lead(session, conversation, args)
        elif tool_name == "get_lead_by_phone":
            result = await _get_lead_by_phone(session, args)
        elif tool_name == "request_human_handoff":
            result = await _request_handoff(session, conversation, args)
        else:
            err = f"unknown_tool:{tool_name}"
            result = {"ok": False, "error": err}
    except Exception as exc:  # noqa: BLE001
        err = str(exc)
        result = {"ok": False, "error": err}

    duration_ms = int((time.perf_counter() - started) * 1000)
    await _log_tool(
        session,
        conversation_id=conversation.id,
        tool_name=tool_name,
        arguments=args,
        result=result if err is None else None,
        error=err,
        duration_ms=duration_ms,
    )
    return json.dumps(result or {"ok": False})


SYSTEM_PROMPT_BASE = """Eres el asistente de WhatsApp de un negocio en América Latina.
Prioriza reglas y vocabulario del panel del negocio; si el negocio es de Perú, usa contexto local
(ciudades y distritos, soles PEN, boleta/factura y RUC cuando el negocio lo pida en sus instrucciones).
Responde en español salvo que el usuario escriba en otro idioma. Sé breve y claro (estilo WhatsApp).

Exactitud comercial:
- Si en la configuración existe un bloque de catálogo o lista de precios, trátalo como fuente de verdad:
  no inventes SKU, precios ni stock. Si el producto no está listado, dilo y ofrece alternativa del catálogo
  o pasar a un humano.
- Respeta las reglas de precios, envíos, pagos y devoluciones del panel; si algo no está escrito, no lo asumas.

CRM (muy importante):
- Cuando el usuario comparta datos útiles para venta o seguimiento (nombre, correo, ciudad o distrito,
  empresa, qué le interesa comprar, presupuesto aproximado, plazos, etc.), llama a la herramienta
  save_lead en ese mismo turno o en cuanto tengas esos datos; si más adelante corrigen o agregan
  información, vuelve a llamar save_lead para actualizar.
- Al iniciar una consulta de compra o cotización, puedes usar get_lead_by_phone con el número del chat
  para recuperar datos ya guardados y no repetir preguntas.
- No inventes datos en el CRM: solo guarda lo que el usuario (o el hilo) indique de forma razonable.
- Si piden hablar con una persona, hay reclamo grave o no puedes resolver, usa request_human_handoff
  y tranquiliza: alguien del equipo dará seguimiento."""


def _prompt_section(title: str, body: str) -> str:
    text = (body or "").strip()
    if not text:
        return ""
    return f"\n\n## {title}\n{text}"


def build_system_prompt(eff: EffectiveSettings) -> str:
    parts: list[str] = [SYSTEM_PROMPT_BASE]
    parts.append(_prompt_section("Contexto del negocio (panel)", eff.agent_business_summary))
    parts.append(_prompt_section("Límites estrictos y cumplimiento", eff.agent_hard_rules))
    parts.append(
        _prompt_section(
            "Catálogo: productos, servicios, SKU y referencias",
            eff.agent_catalog,
        )
    )
    parts.append(_prompt_section("Reglas de precios, impuestos y redondeos", eff.agent_pricing_rules))
    parts.append(_prompt_section("Envíos, cobertura y tiempos", eff.agent_shipping_zones))
    parts.append(_prompt_section("Medios de pago y condiciones", eff.agent_payment_methods))
    parts.append(_prompt_section("Cambios, devoluciones y garantía", eff.agent_returns_warranty))
    parts.append(_prompt_section("Preguntas frecuentes (respuestas cortas)", eff.agent_faq))
    parts.append(
        _prompt_section(
            "Fuera de horario o respuesta cuando no hay stock",
            eff.agent_off_hours_message,
        )
    )
    parts.append(_prompt_section("Instrucciones de tono, saludo y estilo", eff.agent_instructions))
    if eff.agent_lead_capture.strip():
        parts.append(
            _prompt_section(
                "Datos a capturar en el lead",
                eff.agent_lead_capture
                + "\n\nUsa save_lead (campos estructurados y/o notes) cuando tengas esa información.",
            )
        )
    parts.append(
        "\n\n## Recordatorio final\n"
        "Los datos guardados con save_lead son los que el dueño del negocio ve en el panel en «Leads». "
        "Si hubo intercambio con datos de contacto o de pedido y aún no llamaste save_lead, hazlo antes de cerrar el tema."
    )
    return "".join(parts)


async def generate_assistant_reply(
    session: AsyncSession,
    *,
    conversation: Conversation,
    user_text: str,
) -> str:
    eff = await build_effective_settings(session)
    provider = eff.llm_provider.lower()

    if provider == "gemini":
        if eff.gemini_api_key:
            from app.agent.gemini_agent import generate_with_gemini

            return await generate_with_gemini(
                session,
                conversation=conversation,
                user_text=user_text,
                eff=eff,
            )
        return (
            f"Recibí tu mensaje. Resumen rápido: «{user_text[:500]}»\n\n"
            "Modo sin LLM: el proveedor es **Gemini** pero falta la API key. "
            "En Configuración pega la clave (Google AI Studio → Get API key) y guarda."
        )

    # Proveedor OpenAI (por defecto)
    if not eff.openai_api_key:
        if eff.gemini_api_key:
            return (
                f"Recibí tu mensaje. Resumen rápido: «{user_text[:500]}»\n\n"
                "El proveedor de LLM está en **OpenAI**, pero solo tienes clave **Gemini** guardada. "
                "En Configuración cambia el proveedor a **Gemini**, guarda, y vuelve a escribir."
            )
        return (
            f"Recibí tu mensaje. Resumen rápido: «{user_text[:500]}»\n\n"
            "Modo sin LLM: en Configuración elige proveedor y clave (OpenAI o Gemini), "
            "o variables de entorno / panel."
        )

    history = await list_recent_messages(session, conversation.id, limit=24)
    system_text = build_system_prompt(eff)
    openai_messages: list[dict[str, Any]] = [{"role": "system", "content": system_text}]
    for m in history:
        if m.direction == MessageDirection.inbound:
            openai_messages.append({"role": "user", "content": m.body})
        else:
            openai_messages.append({"role": "assistant", "content": m.body})

    if not history or history[-1].direction != MessageDirection.inbound:
        openai_messages.append({"role": "user", "content": user_text})

    client = AsyncOpenAI(api_key=eff.openai_api_key)
    max_iterations = 6
    for _ in range(max_iterations):
        completion = await client.chat.completions.create(
            model=eff.openai_model,
            messages=openai_messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
        )
        choice = completion.choices[0].message
        if choice.tool_calls:
            openai_messages.append(
                {
                    "role": "assistant",
                    "content": choice.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in choice.tool_calls
                    ],
                }
            )
            for tc in choice.tool_calls:
                name = tc.function.name
                payload = await execute_tool(
                    session,
                    conversation=conversation,
                    tool_name=name,
                    raw_arguments=tc.function.arguments,
                )
                openai_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": payload,
                    }
                )
            continue
        text = (choice.content or "").strip()
        return text or "Gracias por tu mensaje. Un agente te contactará pronto."

    return "No pude completar la solicitud en este momento. Intenta de nuevo en unos minutos."
