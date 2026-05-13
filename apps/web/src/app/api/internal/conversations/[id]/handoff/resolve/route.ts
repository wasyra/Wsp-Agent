import { proxyToBackend } from "@/lib/backend-proxy";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/internal/conversations/${id}/handoff/resolve`, { method: "POST" });
}
