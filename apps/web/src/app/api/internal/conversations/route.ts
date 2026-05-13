import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const path = qs
    ? `/internal/conversations?${qs}`
    : "/internal/conversations?limit=100";
  return proxyToBackend(req, path, { method: "GET" });
}
