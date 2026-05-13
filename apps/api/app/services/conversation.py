from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Conversation,
    ConversationStatus,
    Message,
    MessageDirection,
)


async def get_inbound_by_twilio_sid(
    session: AsyncSession, twilio_message_sid: str
) -> Message | None:
    stmt = select(Message).where(
        Message.twilio_message_sid == twilio_message_sid,
        Message.direction == MessageDirection.inbound,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_or_create_conversation(
    session: AsyncSession,
    *,
    twilio_from: str,
    twilio_to: str,
    account_sid: str | None,
) -> Conversation:
    stmt = select(Conversation).where(
        Conversation.twilio_from == twilio_from,
        Conversation.twilio_to == twilio_to,
    )
    result = await session.execute(stmt)
    conv = result.scalar_one_or_none()
    if conv:
        return conv
    conv = Conversation(
        twilio_from=twilio_from,
        twilio_to=twilio_to,
        account_sid=account_sid,
        status=ConversationStatus.open,
    )
    session.add(conv)
    await session.flush()
    return conv


async def add_message(
    session: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    direction: MessageDirection,
    body: str,
    twilio_message_sid: str | None = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        direction=direction,
        body=body,
        twilio_message_sid=twilio_message_sid,
    )
    session.add(msg)
    await session.flush()
    await session.execute(
        update(Conversation).where(Conversation.id == conversation_id).values(updated_at=func.now())
    )
    return msg


async def list_recent_messages(
    session: AsyncSession, conversation_id: uuid.UUID, limit: int = 30
) -> Sequence[Message]:
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = list(result.scalars().all())
    rows.reverse()
    return rows


async def set_conversation_status(
    session: AsyncSession, conversation_id: uuid.UUID, status: ConversationStatus
) -> None:
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    result = await session.execute(stmt)
    conv = result.scalar_one_or_none()
    if conv:
        conv.status = status
