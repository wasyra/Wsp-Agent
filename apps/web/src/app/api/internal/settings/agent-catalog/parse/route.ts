import { NextResponse } from "next/server";

import { forwardedRequestId, proxyToBackend } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  const rid = forwardedRequestId(req);
  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json(
      { detail: "FormData inválido", request_id: rid },
      { status: 400, headers: { "X-Request-ID": rid } },
    );
  }

  const file = incoming.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { detail: "Adjunta un archivo .csv o .xlsx", request_id: rid },
      { status: 400, headers: { "X-Request-ID": rid } },
    );
  }

  const out = new FormData();
  out.append("file", file, file.name);

  return proxyToBackend(req, "/internal/settings/agent-catalog/parse", {
    method: "POST",
    body: out,
  });
}
