-- Wsp-Agent: mismo esquema que SQLAlchemy (models). Aplicada también en remoto vía Supabase MCP.
CREATE TYPE conversationstatus AS ENUM ('open', 'handed_off', 'closed');
CREATE TYPE messagedirection AS ENUM ('inbound', 'outbound');
CREATE TYPE handoffstatus AS ENUM ('pending', 'resolved');

CREATE TABLE conversations (
	id UUID NOT NULL PRIMARY KEY,
	twilio_from VARCHAR(64) NOT NULL,
	twilio_to VARCHAR(64) NOT NULL,
	account_sid VARCHAR(64),
	status conversationstatus NOT NULL,
	internal_notes TEXT,
	internal_tags JSONB,
	last_agent_llm_status VARCHAR(16) NOT NULL,
	last_agent_llm_error TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_conversations_from_to UNIQUE (twilio_from, twilio_to)
);

CREATE INDEX ix_conversations_twilio_to ON conversations (twilio_to);
CREATE INDEX ix_conversations_twilio_from ON conversations (twilio_from);

CREATE TABLE app_configuration (
	id SERIAL PRIMARY KEY,
	twilio_account_sid TEXT,
	twilio_auth_token TEXT,
	webhook_base_url VARCHAR(512),
	twilio_validate_signature BOOLEAN,
	openai_api_key TEXT,
	openai_model VARCHAR(64),
	llm_provider VARCHAR(16),
	gemini_api_key TEXT,
	gemini_model VARCHAR(64),
	agent_business_summary TEXT,
	agent_instructions TEXT,
	agent_lead_capture TEXT,
	agent_catalog TEXT,
	agent_pricing_rules TEXT,
	agent_shipping_zones TEXT,
	agent_payment_methods TEXT,
	agent_returns_warranty TEXT,
	agent_faq TEXT,
	agent_off_hours_message TEXT,
	agent_hard_rules TEXT,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
	id UUID NOT NULL PRIMARY KEY,
	conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	direction messagedirection NOT NULL,
	body TEXT NOT NULL,
	twilio_message_sid VARCHAR(64),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_messages_twilio_sid UNIQUE (twilio_message_sid)
);

CREATE INDEX ix_messages_conversation_id ON messages (conversation_id);

CREATE TABLE leads (
	id UUID NOT NULL PRIMARY KEY,
	conversation_id UUID NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
	phone VARCHAR(32) NOT NULL,
	email VARCHAR(255),
	name VARCHAR(255),
	qualification JSONB,
	stage VARCHAR(64) NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_leads_phone ON leads (phone);

CREATE TABLE tool_invocations (
	id UUID NOT NULL PRIMARY KEY,
	conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	tool_name VARCHAR(128) NOT NULL,
	arguments JSONB,
	result JSONB,
	error TEXT,
	duration_ms INTEGER,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_tool_invocations_conversation_id ON tool_invocations (conversation_id);

CREATE TABLE handoffs (
	id UUID NOT NULL PRIMARY KEY,
	conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
	reason TEXT NOT NULL,
	status handoffstatus NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	resolved_at TIMESTAMPTZ
);

CREATE INDEX ix_handoffs_conversation_id ON handoffs (conversation_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
