import { NextResponse } from "next/server";

import { forwardedRequestId, proxyToBackend } from "@/lib/backend-proxy";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let bodyText: string;
  try {
    bodyText = JSON.stringify(await req.json());
  } catch {
    const rid = forwardedRequestId(req);
    return NextResponse.json(
      { detail: "JSON inválido", request_id: rid },
      { status: 400, headers: { "X-Request-ID": rid } },
    );
  }
  return proxyToBackend(req, `/internal/conversations/${id}/panel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: bodyText,
  });
}
