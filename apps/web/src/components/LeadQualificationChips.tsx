const LABELS: Record<string, string> = {
  company: "Empresa",
  service_or_product: "Interés",
  city: "Ciudad",
  budget_range: "Presupuesto",
  score: "Puntuación",
  notes: "Notas",
};

const PREFERRED_ORDER = [
  "company",
  "service_or_product",
  "city",
  "budget_range",
  "score",
  "notes",
] as const;

function labelForKey(key: string): string {
  if (key in LABELS) return LABELS[key]!;
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function entriesFromQualification(q: Record<string, unknown>): { key: string; label: string; value: string }[] {
  const out: { key: string; label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const k of PREFERRED_ORDER) {
    if (!(k in q)) continue;
    const raw = q[k];
    if (raw == null || String(raw).trim() === "") continue;
    out.push({ key: k, label: LABELS[k] ?? labelForKey(k), value: String(raw).trim() });
    seen.add(k);
  }
  for (const k of Object.keys(q)) {
    if (seen.has(k)) continue;
    const raw = q[k];
    if (raw == null || String(raw).trim() === "") continue;
    if (typeof raw === "object") continue;
    out.push({ key: k, label: labelForKey(k), value: String(raw).trim() });
  }
  return out;
}

export function LeadQualificationChips({ q }: { q: Record<string, unknown> | null }) {
  if (!q || Object.keys(q).length === 0) return null;
  const items = entriesFromQualification(q);
  if (items.length === 0) {
    const raw = JSON.stringify(q);
    return (
      <span
        className="max-w-full truncate font-mono text-[10px] text-[var(--wa-text-muted)]"
        title={raw}
      >
        {raw.length > 80 ? `${raw.slice(0, 80)}…` : raw}
      </span>
    );
  }
  return (
    <ul className="flex max-w-full flex-wrap gap-1">
      {items.map(({ key, label, value }) => (
        <li
          key={key}
          className="max-w-[14rem] truncate rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[11px] text-[var(--wa-text)]"
          title={`${label}: ${value}`}
        >
          <span className="text-[var(--wa-text-muted)]">{label}</span>{" "}
          <span className="font-medium text-[var(--wa-text)]">{value}</span>
        </li>
      ))}
    </ul>
  );
}
