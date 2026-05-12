import { getBackendUrl, getInternalApiKey } from "@/lib/env";

const internalHeaders = (): HeadersInit => ({
  "X-API-Key": getInternalApiKey(),
});

export type ConversationSummary = {
  id: string;
  twilio_from: string;
  twilio_to: string;
  status: string;
  updated_at: string;
  message_count: number;
  last_agent_llm_status: string;
};

export type ConversationDetail = {
  id: string;
  twilio_from: string;
  twilio_to: string;
  status: string;
  updated_at: string;
  messages: {
    id: string;
    direction: string;
    body: string;
    twilio_message_sid: string | null;
    created_at: string;
  }[];
  lead: {
    id: string;
    phone: string;
    email: string | null;
    name: string | null;
    stage: string;
    qualification: Record<string, unknown> | null;
  } | null;
  internal_notes: string | null;
  internal_tags: string[];
  last_agent_llm_status: string;
  last_agent_llm_error: string | null;
  pending_handoff: {
    id: string;
    reason: string;
    status: string;
    created_at: string;
  } | null;
};

export type LeadListItem = {
  id: string;
  conversation_id: string;
  twilio_from: string;
  phone: string;
  email: string | null;
  name: string | null;
  stage: string;
  qualification: Record<string, unknown> | null;
  updated_at: string;
};

function appendConvFilters(
  q: URLSearchParams,
  p: {
    q?: string | null;
    status?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    limit?: number;
    offset?: number;
  },
) {
  if (p.q != null && String(p.q).trim() !== "") q.set("q", String(p.q).trim());
  if (p.status != null && String(p.status).trim() !== "") q.set("status", String(p.status).trim());
  if (p.date_from != null && String(p.date_from).trim() !== "") q.set("date_from", String(p.date_from).trim());
  if (p.date_to != null && String(p.date_to).trim() !== "") q.set("date_to", String(p.date_to).trim());
  q.set("limit", String(p.limit ?? 100));
  if (p.offset != null) q.set("offset", String(p.offset));
}

export async function fetchConversations(
  params: {
    q?: string | null;
    status?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    limit?: number;
    offset?: number;
  } = {},
) {
  const q = new URLSearchParams();
  appendConvFilters(q, params);
  const res = await fetch(`${getBackendUrl()}/internal/conversations?${q}`, {
    headers: internalHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversations: ${res.status}`);
  }
  return res.json() as Promise<ConversationSummary[]>;
}

function appendLeadFilters(
  q: URLSearchParams,
  p: {
    q?: string | null;
    stage?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    limit?: number;
    offset?: number;
  },
) {
  if (p.q != null && String(p.q).trim() !== "") q.set("q", String(p.q).trim());
  if (p.stage != null && String(p.stage).trim() !== "") q.set("stage", String(p.stage).trim());
  if (p.date_from != null && String(p.date_from).trim() !== "") q.set("date_from", String(p.date_from).trim());
  if (p.date_to != null && String(p.date_to).trim() !== "") q.set("date_to", String(p.date_to).trim());
  q.set("limit", String(p.limit ?? 200));
  q.set("offset", String(p.offset ?? 0));
}

export async function fetchLeads(
  params: {
    q?: string | null;
    stage?: string | null;
    date_from?: string | null;
    date_to?: string | null;
    limit?: number;
    offset?: number;
  } = {},
) {
  const q = new URLSearchParams();
  appendLeadFilters(q, params);
  const res = await fetch(`${getBackendUrl()}/internal/leads?${q}`, {
    headers: internalHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load leads: ${res.status}`);
  }
  return res.json() as Promise<LeadListItem[]>;
}

export async function fetchConversation(id: string) {
  const res = await fetch(`${getBackendUrl()}/internal/conversations/${id}`, {
    headers: internalHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversation: ${res.status}`);
  }
  return res.json() as Promise<ConversationDetail>;
}
