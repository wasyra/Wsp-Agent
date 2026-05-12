import { NextResponse } from "next/server";

import { getBackendUrl, getInternalApiKey } from "@/lib/env";

export async function GET() {
  let key: string;
  try {
    key = getInternalApiKey();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
  const res = await fetch(`${getBackendUrl()}/internal/settings`, {
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

export async function PUT(req: Request) {
  let key: string;
  try {
    key = getInternalApiKey();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
  const body = await req.text();
  const res = await fetch(`${getBackendUrl()}/internal/settings`, {
    method: "PUT",
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
    },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
