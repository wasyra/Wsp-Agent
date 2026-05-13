import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forward = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) {
    forward.set(k, v);
  }
  if (!forward.has("limit")) forward.set("limit", "100");
  if (!forward.has("offset")) forward.set("offset", "0");
  return proxyToBackend(req, `/internal/leads?${forward}`, { method: "GET" });
}
