import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl, getInternalApiKey } from "@/lib/env";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  let key: string;
  try {
    key = getInternalApiKey();
  } catch {
    return NextResponse.json({ detail: "INTERNAL_API_KEY missing" }, { status: 500 });
  }
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const res = await fetch(`${backend}/internal/conversations/${id}/handoff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
