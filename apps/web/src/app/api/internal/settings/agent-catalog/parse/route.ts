import { NextResponse } from "next/server";

import { getBackendUrl, getInternalApiKey } from "@/lib/env";

export async function POST(req: Request) {
  let key: string;
  try {
    key = getInternalApiKey();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Config error";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json({ detail: "FormData inválido" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ detail: "Adjunta un archivo .csv o .xlsx" }, { status: 400 });
  }

  const out = new FormData();
  out.append("file", file, file.name);

  const res = await fetch(`${getBackendUrl()}/internal/settings/agent-catalog/parse`, {
    method: "POST",
    headers: { "X-API-Key": key },
    body: out,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
