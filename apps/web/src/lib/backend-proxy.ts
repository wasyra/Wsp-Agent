import { NextResponse } from "next/server";

import { getBackendUrl, getInternalApiKey } from "@/lib/env";

const ID_HEADERS = ["x-request-id", "x-correlation-id"] as const;

export function forwardedRequestId(req: Request): string {
  for (const h of ID_HEADERS) {
    const v = req.headers.get(h)?.trim();
    if (v) return v.slice(0, 128);
  }
  return crypto.randomUUID();
}

function jsonError(status: number, detail: unknown, rid: string): NextResponse {
  return NextResponse.json(
    { detail, request_id: rid },
    { status, headers: { "X-Request-ID": rid, "content-type": "application/json" } },
  );
}

/**
 * Proxy al FastAPI con X-API-Key, propagación de X-Request-ID y errores JSON unificados (`detail` + `request_id`).
 */
export async function proxyToBackend(
  incoming: Request,
  backendPath: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const rid = forwardedRequestId(incoming);
  let key: string;
  try {
    key = getInternalApiKey();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Config error";
    return jsonError(500, msg, rid);
  }
  const path = backendPath.startsWith("/") ? backendPath : `/${backendPath}`;
  const url = `${getBackendUrl()}${path}`;
  const headers = new Headers(init.headers);
  headers.set("X-API-Key", key);
  headers.set("X-Request-ID", rid);
  const res = await fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
  const text = await res.text();
  const outRid = res.headers.get("X-Request-ID")?.trim() || rid;
  const out = new Headers();
  out.set("X-Request-ID", outRid);
  const ct = res.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { detail?: unknown };
      return NextResponse.json(
        { detail: j.detail ?? j, request_id: outRid },
        { status: res.status, headers: out },
      );
    } catch {
      return NextResponse.json(
        { detail: text.slice(0, 2000), request_id: outRid },
        { status: res.status, headers: out },
      );
    }
  }
  return new NextResponse(text, { status: res.status, headers: out });
}
