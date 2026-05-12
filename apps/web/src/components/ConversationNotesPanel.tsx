"use client";

import { useState } from "react";

type Props = {
  conversationId: string;
  initialNotes: string | null;
  initialTags: string[];
};

function parseTags(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 32);
}

export function ConversationNotesPanel({ conversationId, initialNotes, initialTags }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [tagsRaw, setTagsRaw] = useState(initialTags.join(", "));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const initialNotesStr = initialNotes ?? "";
  const initialTagsSorted = [...initialTags].sort().join("\0");
  const dirty =
    notes !== initialNotesStr ||
    [...parseTags(tagsRaw)].sort().join("\0") !== initialTagsSorted;

  const savedHint =
    (initialNotes && initialNotes.trim()) || (initialTags && initialTags.length > 0)
      ? "Guardadas"
      : null;

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/internal/conversations/${conversationId}/panel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_notes: notes.trim() === "" ? null : notes,
          internal_tags: parseTags(tagsRaw),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        setMsg(t || `Error ${res.status}`);
        return;
      }
      setMsg("Guardado.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="group shrink-0 border-t border-white/[0.06] bg-[#0a1014]/95 backdrop-blur-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-left marker:content-none [&::-webkit-details-marker]:hidden sm:px-4">
        <span className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-[var(--wa-text)]">
          <span className="w-4 text-[var(--wa-text-muted)]">›</span>
          <span>Notas del equipo</span>
          {savedHint && !dirty ? (
            <span className="truncate text-[10px] font-normal text-emerald-400/80">{savedHint}</span>
          ) : null}
          {dirty ? (
            <span className="rounded bg-amber-500/15 px-1.5 py-px text-[10px] text-amber-200/90">Sin guardar</span>
          ) : null}
        </span>
        <span className="shrink-0 text-[10px] text-[var(--wa-text-muted)]">Solo interno</span>
      </summary>
      <div className="border-t border-white/[0.04] px-3 pb-2.5 pt-1.5 sm:px-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Contexto interno…"
            className="w-full resize-y rounded-lg border border-white/[0.07] bg-black/35 px-2.5 py-1.5 text-[13px] leading-snug text-[var(--wa-text)] placeholder:text-[var(--wa-text-muted)] focus:border-amber-500/25 focus:outline-none"
          />
          <input
            type="text"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="Etiquetas: vip, seguimiento…"
            className="w-full rounded-lg border border-white/[0.07] bg-black/35 px-2.5 py-1.5 text-[13px] text-[var(--wa-text)] placeholder:text-[var(--wa-text-muted)] focus:border-amber-500/25 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            {msg ? (
              <p
                className={`text-[11px] ${msg.startsWith("Guardado") ? "text-emerald-400/90" : "text-[var(--wa-danger)]"}`}
              >
                {msg}
              </p>
            ) : (
              <p className="text-[10px] text-[var(--wa-text-muted)]">No van al WhatsApp del cliente.</p>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              {saving ? "…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
