"""Initial schema from SQLAlchemy models + idempotent column adds for legacy DBs."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import app.models  # noqa: F401
from app.db.base import Base

revision: str = "001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_LEGACY_ALTER = (
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(16)",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS gemini_api_key TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS gemini_model VARCHAR(64)",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_business_summary TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_instructions TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_lead_capture TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_catalog TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_pricing_rules TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_shipping_zones TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_payment_methods TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_returns_warranty TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_faq TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_off_hours_message TEXT",
    "ALTER TABLE app_configuration ADD COLUMN IF NOT EXISTS agent_hard_rules TEXT",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS internal_notes TEXT",
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS internal_tags JSONB",
    (
        "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS "
        "last_agent_llm_status VARCHAR(16) DEFAULT 'ok'"
    ),
    "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_agent_llm_error TEXT",
)


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)
    for stmt in _LEGACY_ALTER:
        op.execute(sa.text(stmt))


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
