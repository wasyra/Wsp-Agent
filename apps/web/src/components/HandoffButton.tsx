"use client";

import { useState } from "react";

type Props = {
  conversationId: string;
  currentStatus: string;
};

export function HandoffButton({ conversationId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onHandoff() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/internal/conversations/${conversationId}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "manual_from_next_panel" }),
      });
      if (!res.ok) {
        const t = await res.text();
        setMessage(t || `Error ${res.status}`);
        return;
      }
      window.location.reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || currentStatus === "handed_off";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={onHandoff}
        disabled={disabled}
        className="rounded-full border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-orange-600/10 px-3.5 py-1.5 text-xs font-semibold text-amber-50 shadow-md backdrop-blur-sm transition hover:from-amber-500/30 hover:to-orange-600/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {currentStatus === "handed_off" ? "Escalada" : loading ? "…" : "Escalar"}
      </button>
      {message ? (
        <p className="max-w-[10rem] text-right text-[10px] leading-tight text-[var(--wa-danger)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
