import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  return proxyToBackend(req, "/internal/settings", { method: "GET" });
}

export async function PUT(req: Request) {
  const body = await req.text();
  return proxyToBackend(req, "/internal/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
