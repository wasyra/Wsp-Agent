import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyToBackend(req, "/internal/status", { method: "GET" });
}
