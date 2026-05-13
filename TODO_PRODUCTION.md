# Production Readiness TODO

This file tracks the work remaining to take Wsp-Agent from the current **pilot-ready** state (demo + Gemini-only WhatsApp Sandbox + single-tenant panel) to a **production-grade multi-tenant deployment**.

Reflects the audit summarized in [`README.md`](./README.md#de-demo-a-pilot-a-producción) → "Producción multi-tenant ~25%". Items are grouped by priority. Each task has explicit acceptance criteria so it can be picked up independently.

> **Owner placeholder**: assign per task before starting work. Use issue links once tracked on GitHub.

---

## P0 — Hard blockers for production

These must be resolved before exposing the system to real customer traffic.

### [ ] Move panel secrets out of plaintext database storage

**Context**: Today `apps/api/app/services/effective_settings.py` reads Twilio Auth Token, OpenAI key and Gemini key directly from the Supabase `app_configuration` table as plain strings. Anyone with read access to the DB can exfiltrate every integration credential.

**Acceptance**:
- Introduce a `SecretStore` abstraction with at least one concrete backend (AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault / 1Password Connect).
- `app_configuration` stores **references** (e.g. `vault://wasyra/twilio/auth_token`) rather than the secret itself.
- `EffectiveSettings` resolves references at request time with an LRU cache (TTL ≤ 5 min) so the secret never enters the SQL query log.
- Migration script that, when run with elevated credentials, extracts current secrets, writes them to the vault, and replaces the DB rows with the new reference strings.
- Smoke test: with the DB row referencing the vault, the agent successfully sends a Twilio message and calls the LLM.

### [ ] Multi-tenant scoping on `/internal/*`

**Context**: `apps/api/app/deps.py::verify_internal_api_key` validates a single shared secret with no notion of workspace. Any holder reads every conversation in the deployment (documented in the docstring there).

**Acceptance**:
- Add `workspace_id UUID` column to `conversations`, `messages`, `leads`, `handoffs`, `tool_invocations`, `app_configuration`. Backfill existing rows to a default workspace.
- Issue per-workspace API keys (table `workspace_api_keys` with hashed key + `workspace_id`).
- Replace `verify_internal_api_key` with a dependency that returns a `WorkspaceContext` (id + scopes).
- Every query in `apps/api/app/routers/internal.py` filters by the resolved `workspace_id`.
- Add a test that creates two workspaces, issues a key for each, and asserts cross-tenant reads return 404 (never 403, to avoid leaking existence).

### [ ] LLM call timeouts to protect the Twilio webhook

**Context**: `apps/api/app/agent/tool_handlers.py` and `apps/api/app/agent/gemini_agent.py` call the LLM SDK with no client-side timeout. Twilio retries the webhook if the response takes longer than its server timeout (~10-15 s), which causes duplicate processing and user-visible delivery failures.

**Acceptance**:
- Wrap every outbound LLM call (`client.chat.completions.create`, `client.models.generate_content`) with `asyncio.timeout(LLM_TIMEOUT_SECONDS)` (env var, default 25 s).
- On `TimeoutError`, log a warning with `request_id` and `conversation_id`, then return a graceful fallback message instead of crashing the webhook.
- Add a unit test that monkeypatches the LLM client to sleep > timeout and asserts the fallback message is returned.

### [ ] Decide and document TwiML sync vs. async-queue dispatch

**Context**: Today the agent runs inside the webhook request and replies with `TwiML`. As soon as the LLM, a tool, or both push latency above ~10 s the webhook times out. The plan document leaves this open ("Opción A vs B").

**Acceptance**:
- Decision Record (`docs/adr/0001-twiml-vs-async.md`) capturing the choice, the latency budget, and the migration plan.
- If async is chosen: add a `dispatcher` worker that consumes from Redis Streams (or RabbitMQ) and sends replies via the Twilio REST Messaging API. The webhook returns 202 immediately.
- If sync remains: hard `asyncio.timeout(8s)` on the orchestrator and a documented hand-off message if the budget is exceeded.

---

## P1 — Critical for first production deployment

### [ ] Tighten CORS

**Context**: `apps/api/app/main.py` sets `allow_methods=["*"]` and `allow_headers=["*"]`.

**Acceptance**:
- Restrict `allow_methods` to the union actually used by the Next.js BFF: `GET, POST, PATCH, PUT, DELETE, OPTIONS`.
- Restrict `allow_headers` to `Authorization, Content-Type, X-API-Key, X-Request-ID, X-Correlation-ID`.
- Read `CORS_ORIGINS` strictly as a comma-separated list; default to empty in production (no wildcard fallback).

### [ ] Integration tests against a real Postgres in CI

**Context**: Today every test in `apps/api/tests/` mocks the DB session. CI spins up Postgres 16 but no test actually hits it. The Alembic migration is therefore untested end-to-end on PRs.

**Acceptance**:
- New `tests/integration/` package, gated by `pytest -m integration`.
- A fixture that runs `alembic upgrade head` against the CI Postgres before any integration test.
- Cover at minimum: webhook → orchestrator → `save_lead` tool → row visible via `/internal/conversations/{id}` and `/internal/leads`.
- CI workflow runs both unit and integration suites.

### [ ] Rotate `INTERNAL_API_KEY` and enforce length

**Context**: The `.env.example` ships `INTERNAL_API_KEY=dev-internal-key`. There is no length validation; a deployment that forgets to rotate exposes the panel publicly.

**Acceptance**:
- `apps/api/app/config.py` validator: when `ENVIRONMENT=production`, refuse to boot if the key is shorter than 32 chars or matches the dev default.
- Document rotation procedure in `docs/operations/key-rotation.md`.

### [ ] LLM cost monitoring & budget guard

**Context**: No tracking of tokens spent per conversation. A runaway loop or abusive client can rack up unbounded LLM costs.

**Acceptance**:
- New Prometheus counters: `llm_input_tokens_total`, `llm_output_tokens_total`, `llm_request_total` labelled by `provider` and `workspace_id`.
- Per-workspace daily budget cap read from `app_configuration`; when exceeded, the orchestrator stops calling the LLM and replies with the configured "off-hours / no LLM" message until the next UTC day or manual reset.
- Alert rule template (Grafana / Alertmanager) at 80 % of the daily budget.

### [ ] Database backups and restore drill

**Context**: Supabase has automatic backups on paid plans, but the project hasn't run a documented restore.

**Acceptance**:
- Confirm and document the Supabase backup tier in use.
- Quarterly drill: restore the latest backup into a scratch project and run `scripts/check_db.py` plus a read-only integration test against it.
- Operational runbook in `docs/operations/restore.md`.

---

## P2 — Hardening, observability, DX

### [ ] Distributed tracing

**Context**: `X-Request-ID` propagates through the BFF and into the API log, but there is no span-level tracing across `webhook → orchestrator → LLM → tool → DB`.

**Acceptance**:
- Adopt OpenTelemetry: `opentelemetry-instrumentation-fastapi`, `opentelemetry-instrumentation-sqlalchemy`, and a custom span wrapper around the LLM SDK call.
- OTLP exporter configurable via `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Trace ID surfaces in JSON logs alongside `request_id`.

### [ ] Latency histograms for LLM and DB

**Context**: Current Prometheus output is counter-only. P95/P99 latency for LLM calls is invisible.

**Acceptance**:
- Histograms: `llm_request_duration_seconds{provider}`, `db_query_duration_seconds{query_kind}`, `webhook_e2e_duration_seconds`.
- Default buckets cover 50 ms → 30 s.

### [ ] Reduce `raw_payload` retention on `messages`

**Context**: `apps/api/app/models/__init__.py::Message.raw_payload` stores the full Twilio webhook body (JSONB). Useful for debugging but it duplicates user content and grows the DB indefinitely.

**Acceptance**:
- Add a `RAW_PAYLOAD_RETENTION_DAYS` setting (default 7).
- Nightly job (Alembic-managed cron or external) nulls out `raw_payload` for rows older than the retention window.
- Verify the API does not depend on `raw_payload` for any user-facing read path.

### [ ] Webhook idempotency at the HTTP layer

**Context**: Idempotency is enforced inside `apps/api/app/services/orchestrator.py` by looking up `twilio_message_sid` before processing. If a retry arrives during a slow first-attempt run, both can proceed concurrently and double-charge the LLM.

**Acceptance**:
- Move the idempotency check ahead of the orchestrator: an upsert into a small `webhook_inbox(message_sid PK, received_at, status)` table inside a short transaction; if the row exists, return the cached TwiML response (or 202 + duplicate marker).
- Soak test with 100 concurrent identical webhook deliveries — only one orchestrator run should be observed in logs.

### [ ] Webhook structured-output validation

**Context**: The Gemini path occasionally returns malformed tool_call JSON; the orchestrator logs and replies with a generic apology. There is no structured-output path for the planned `LeadQualification` Pydantic model.

**Acceptance**:
- Add a `LeadQualification` Pydantic schema for structured output.
- A second, lightweight LLM call (or `response_format=json_schema` when supported) populates and validates it after the main reply.
- Tests cover the malformed-JSON case (retry once, then degrade).

### [ ] Pre-commit and CI parity

**Context**: `.pre-commit-config.yaml` runs Ruff over `apps/api` only. The web app lacks an enforced pre-commit and Dependabot PRs touching `apps/web` rely on CI alone.

**Acceptance**:
- Add ESLint + Prettier hooks for `apps/web` in pre-commit.
- Add `ruff format --check` to CI alongside `ruff check`.

---

## P3 — Roadmap / nice-to-have

- **OpenAPI typed SDK published** to npm as `@wasyra/wsp-agent-sdk` so third-party integrators get an autogenerated client.
- **Multi-channel**: extend the same orchestrator to Instagram DM and WebChat. Today everything is wired to `twilio_from` / `twilio_to`; introduce a `channel` enum.
- **A/B testing of system prompts** per workspace, with metrics tied to lead quality and handoff rate.
- **Vector store for FAQ** (`search_faq` tool from the original plan but never implemented).
- **Operator-side reply UI** in the panel so the human-handoff actually allows messaging back via Twilio.
- **i18n** of the panel and system prompt beyond Peru / LATAM defaults.

---

## How to use this file

- Each unchecked item is a candidate issue. When you start one, open a GitHub issue, link it here, and check the box only on merge.
- New tasks belong in the section matching their priority; P0/P1 changes should be discussed in an ADR under `docs/adr/`.
- Keep this list under ~30 entries — once something ships, remove it instead of leaving a checked line forever.
