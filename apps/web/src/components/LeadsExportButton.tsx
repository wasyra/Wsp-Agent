"use client";

import type { LeadListItem } from "@/lib/server-api";

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function LeadsExportButton({ rows }: { rows: LeadListItem[] }) {
  function downloadCsv() {
    const headers = [
      "id",
      "conversation_id",
      "twilio_from",
      "phone",
      "email",
      "name",
      "stage",
      "updated_at",
      "qualification_json",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const q = r.qualification ? JSON.stringify(r.qualification) : "";
      lines.push(
        [
          r.id,
          r.conversation_id,
          r.twilio_from,
          r.phone,
          r.email ?? "",
          r.name ?? "",
          r.stage,
          r.updated_at,
          q,
        ]
          .map((c) => csvEscape(String(c)))
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={downloadCsv}
      className="rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-[var(--wa-text)] transition hover:bg-white/10"
    >
      Exportar CSV
    </button>
  );
}
