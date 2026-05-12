from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.deps import verify_internal_api_key
from app.models import (
    Conversation,
    ConversationStatus,
    Handoff,
    HandoffStatus,
    Lead,
    Message,
)

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(verify_internal_api_key)])


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    direction: str
    body: str
    twilio_message_sid: str | None
    created_at: datetime


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    email: str | None
    name: str | None
    stage: str
    qualification: dict | None


class LeadListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    twilio_from: str
    phone: str
    email: str | None
    name: str | None
    stage: str
    qualification: dict | None
    updated_at: datetime


class ConversationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    twilio_from: str
    twilio_to: str
    status: str
    updated_at: datetime
    message_count: int
    last_agent_llm_status: str


class HandoffBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    reason: str
    status: str
    created_at: datetime


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    twilio_from: str
    twilio_to: str
    status: str
    updated_at: datetime
    messages: list[MessageOut]
    lead: LeadOut | None
    internal_notes: str | None = None
    internal_tags: list[str] = Field(default_factory=list)
    last_agent_llm_status: str = "ok"
    last_agent_llm_error: str | None = None
    pending_handoff: HandoffBrief | None = None


class ConversationPanelPatch(BaseModel):
    internal_notes: str | None = Field(default=None)
    internal_tags: list[str] | None = Field(default=None)


class ConversationPanelOut(BaseModel):
    id: UUID
    internal_notes: str | None
    internal_tags: list[str]


class HandoffCreate(BaseModel):
    reason: str = "manual_from_dashboard"


class HandoffOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    conversation_id: UUID
    reason: str
    status: str
    created_at: datetime


def _utc_day_start(d: date) -> datetime:
    return datetime.combine(d, time.min, tzinfo=timezone.utc)


def _utc_day_end_exclusive(d: date) -> datetime:
    return _utc_day_start(d + timedelta(days=1))


def _normalize_tags(raw: list[str] | None) -> list[str]:
    out: list[str] = []
    for t in (raw or [])[:32]:
        s = str(t).strip()[:48]
        if s:
            out.append(s)
    return out


def _conversation_filters(
    *,
    q: str | None,
    status: str | None,
    date_from: str | None,
    date_to: str | None,
) -> list:
    conds: list = []
    if q and q.strip():
        term = f"%{q.strip()}%"
        lead_match = exists(
            select(1).where(
                Lead.conversation_id == Conversation.id,
                or_(
                    Lead.name.ilike(term),
                    Lead.phone.ilike(term),
                    Lead.email.ilike(term),
                ),
            )
        )
        conds.append(
            or_(
                Conversation.twilio_from.ilike(term),
                Conversation.twilio_to.ilike(term),
                lead_match,
            )
        )
    if status and status.strip():
        raw = status.strip().lower()
        try:
            st = ConversationStatus(raw)
            conds.append(Conversation.status == st)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="status inválido") from exc
    if date_from and date_from.strip():
        try:
            df = date.fromisoformat(date_from.strip()[:10])
            conds.append(Conversation.updated_at >= _utc_day_start(df))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date_from inválido (YYYY-MM-DD)") from exc
    if date_to and date_to.strip():
        try:
            dt = date.fromisoformat(date_to.strip()[:10])
            conds.append(Conversation.updated_at < _utc_day_end_exclusive(dt))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date_to inválido (YYYY-MM-DD)") from exc
    return conds


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, description="Teléfono, canal o texto en lead (nombre/email/tel)"),
    status: str | None = Query(default=None, description="open | handed_off | closed"),
    date_from: str | None = Query(default=None, description="updated_at >= (YYYY-MM-DD UTC)"),
    date_to: str | None = Query(default=None, description="updated_at < día siguiente (YYYY-MM-DD UTC)"),
) -> list[ConversationSummary]:
    count_sq = (
        select(Message.conversation_id, func.count(Message.id).label("cnt"))
        .group_by(Message.conversation_id)
        .subquery()
    )
    stmt = select(Conversation, func.coalesce(count_sq.c.cnt, 0).label("message_count")).outerjoin(
        count_sq, count_sq.c.conversation_id == Conversation.id
    )
    conds = _conversation_filters(q=q, status=status, date_from=date_from, date_to=date_to)
    if conds:
        stmt = stmt.where(and_(*conds))
    stmt = stmt.order_by(Conversation.updated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.all()
    out: list[ConversationSummary] = []
    for conv, msg_count in rows:
        llm = getattr(conv, "last_agent_llm_status", None) or "ok"
        out.append(
            ConversationSummary(
                id=conv.id,
                twilio_from=conv.twilio_from,
                twilio_to=conv.twilio_to,
                status=conv.status.value,
                updated_at=conv.updated_at,
                message_count=int(msg_count or 0),
                last_agent_llm_status=str(llm),
            )
        )
    return out


@router.get("/leads", response_model=list[LeadListItem])
async def list_leads(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None),
    stage: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
) -> list[LeadListItem]:
    stmt = select(Lead, Conversation.twilio_from).join(Conversation, Lead.conversation_id == Conversation.id)
    conds: list = []
    if q and q.strip():
        term = f"%{q.strip()}%"
        conds.append(
            or_(
                Lead.phone.ilike(term),
                Lead.name.ilike(term),
                Lead.email.ilike(term),
                Conversation.twilio_from.ilike(term),
            )
        )
    if stage and stage.strip():
        conds.append(Lead.stage == stage.strip())
    if date_from and date_from.strip():
        try:
            df = date.fromisoformat(date_from.strip()[:10])
            conds.append(Lead.updated_at >= _utc_day_start(df))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date_from inválido") from exc
    if date_to and date_to.strip():
        try:
            dt = date.fromisoformat(date_to.strip()[:10])
            conds.append(Lead.updated_at < _utc_day_end_exclusive(dt))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date_to inválido") from exc
    if conds:
        stmt = stmt.where(and_(*conds))
    stmt = stmt.order_by(Lead.updated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.all()
    return [
        LeadListItem(
            id=lead.id,
            conversation_id=lead.conversation_id,
            twilio_from=twilio_from,
            phone=lead.phone,
            email=lead.email,
            name=lead.name,
            stage=lead.stage,
            qualification=lead.qualification,
            updated_at=lead.updated_at,
        )
        for lead, twilio_from in rows
    ]


def _tags_from_conv(conv: Conversation) -> list[str]:
    raw = getattr(conv, "internal_tags", None)
    if raw is None:
        return []
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return []


def _pending_handoff(conv: Conversation) -> HandoffBrief | None:
    hands = getattr(conv, "handoffs", None) or []
    pending = [h for h in hands if h.status == HandoffStatus.pending]
    if not pending:
        return None
    h = max(pending, key=lambda x: x.created_at)
    return HandoffBrief.model_validate(h)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationDetail:
    stmt = (
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.lead),
            selectinload(Conversation.handoffs),
        )
    )
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = sorted(conv.messages, key=lambda m: m.created_at)
    lead_out = LeadOut.model_validate(conv.lead) if conv.lead else None
    notes = getattr(conv, "internal_notes", None)
    llm_st = getattr(conv, "last_agent_llm_status", None) or "ok"
    llm_err = getattr(conv, "last_agent_llm_error", None)
    return ConversationDetail(
        id=conv.id,
        twilio_from=conv.twilio_from,
        twilio_to=conv.twilio_to,
        status=conv.status.value,
        updated_at=conv.updated_at,
        messages=[MessageOut.model_validate(m) for m in msgs],
        lead=lead_out,
        internal_notes=notes,
        internal_tags=_tags_from_conv(conv),
        last_agent_llm_status=str(llm_st),
        last_agent_llm_error=llm_err,
        pending_handoff=_pending_handoff(conv),
    )


@router.patch("/conversations/{conversation_id}/panel", response_model=ConversationPanelOut)
async def patch_conversation_panel(
    conversation_id: UUID,
    body: ConversationPanelPatch,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationPanelOut:
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    data = body.model_dump(exclude_unset=True)
    if "internal_notes" in data:
        raw = data["internal_notes"]
        conv.internal_notes = None if raw is None else (str(raw).strip() or None)
    if "internal_tags" in data and data["internal_tags"] is not None:
        conv.internal_tags = _normalize_tags(data["internal_tags"])
    await db.commit()
    await db.refresh(conv)
    return ConversationPanelOut(
        id=conv.id,
        internal_notes=getattr(conv, "internal_notes", None),
        internal_tags=_tags_from_conv(conv),
    )


@router.post("/conversations/{conversation_id}/handoff", response_model=HandoffOut)
async def create_handoff(
    conversation_id: UUID,
    body: HandoffCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HandoffOut:
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    ho = Handoff(
        conversation_id=conv.id,
        reason=body.reason,
        status=HandoffStatus.pending,
    )
    conv.status = ConversationStatus.handed_off
    db.add(ho)
    await db.commit()
    await db.refresh(ho)
    return HandoffOut.model_validate(ho)
