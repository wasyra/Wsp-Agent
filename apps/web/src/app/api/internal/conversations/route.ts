import { NextResponse } from "next/server";

import { getBackendUrl, getInternalApiKey } from "@/lib/env";

export async function GET(req: Request) {
  let key: string;
  try {
    key = getInternalApiKey();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = qs
    ? `${getBackendUrl()}/internal/conversations?${qs}`
    : `${getBackendUrl()}/internal/conversations?limit=100`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "X-API-Key": key },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
