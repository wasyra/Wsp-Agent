"use client";

import { useState } from "react";

export function ResolveHandoffButton({
  conversationId,
  hasPendingHandoff,
}: {
  conversationId: string;
  hasPendingHandoff: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!hasPendingHandoff) return null;

  async function onResolve() {
    if (!confirm("¿Marcar este escalado como resuelto? La conversación volverá a estado abierto.")) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/internal/conversations/${conversationId}/handoff/resolve`, {
        method: "POST",
      });
      const j = (await res.json().catch(() => ({}))) as { detail?: unknown };
      if (!res.ok) {
        setMsg(typeof j.detail === "string" ? j.detail : `Error ${res.status}`);
        return;
      }
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onResolve()}
        disabled={loading}
        className="rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-900/60 disabled:opacity-50"
      >
        {loading ? "…" : "Marcar resuelto"}
      </button>
      {msg ? <p className="max-w-[12rem] text-right text-[10px] text-red-200">{msg}</p> : null}
    </div>
  );
}
