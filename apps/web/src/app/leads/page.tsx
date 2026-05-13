import Link from "next/link";

import { LeadsExportButton } from "@/components/LeadsExportButton";
import { fetchLeads } from "@/lib/server-api";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function QualSummary({ q }: { q: Record<string, unknown> | null }) {
  if (!q || Object.keys(q).length === 0) {
    return <span className="text-[var(--wa-text-muted)]">—</span>;
  }
  const labels: Record<string, string> = {
    company: "Empresa",
    service_or_product: "Interés",
    city: "Ciudad",
    budget_range: "Presupuesto",
    score: "Puntuación",
    notes: "Notas",
  };
  const keys = ["company", "service_or_product", "city", "budget_range", "score", "notes"];
  const parts: string[] = [];
  for (const k of keys) {
    if (k in q && q[k] != null && String(q[k]).trim() !== "") {
      parts.push(`${labels[k] ?? k}: ${String(q[k])}`);
    }
  }
  if (parts.length === 0) {
    return (
      <span className="font-mono text-[10px] text-[var(--wa-text-muted)]">
        {JSON.stringify(q).slice(0, 120)}
        {JSON.stringify(q).length > 120 ? "…" : ""}
      </span>
    );
  }
  return (
    <ul className="list-inside list-disc space-y-0.5 text-xs text-[var(--wa-text-muted)]">
      {parts.map((p, i) => (
        <li key={i}>{p}</li>
      ))}
    </ul>
  );
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = pickFirst(sp.q);
  const stage = pickFirst(sp.stage);
  const date_from = pickFirst(sp.date_from);
  const date_to = pickFirst(sp.date_to);

  let rows: Awaited<ReturnType<typeof fetchLeads>> = [];
  let err: string | null = null;
  try {
    rows = await fetchLeads({
      limit: 300,
      offset: 0,
      q,
      stage,
      date_from,
      date_to,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Error al cargar";
  }

  const hasFilters = Boolean(
    (q && q.trim()) || (stage && stage.trim()) || (date_from && date_from.trim()) || (date_to && date_to.trim()),
  );

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[var(--wa-bg)] pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--wa-text)]">Leads</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--wa-text-muted)]">
          Prospectos guardados por el agente cuando ejecuta{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[var(--wa-text)]">save_lead</code> en WhatsApp
          (un registro por conversación; se va completando con cada llamada). Desde una fila puedes abrir el chat
          completo.
        </p>

        <form
          method="get"
          className="mt-6 flex max-w-3xl flex-col gap-3 rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-4 shadow-lg sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="min-w-0 flex-1 sm:max-w-[14rem]">
            <label htmlFor="lq" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--wa-text-muted)]">
              Buscar
            </label>
            <input
              id="lq"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Nombre, teléfono, email…"
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-[var(--wa-text)]"
            />
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="lst" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--wa-text-muted)]">
              Etapa
            </label>
            <input
              id="lst"
              name="stage"
              type="text"
              defaultValue={stage ?? ""}
              placeholder="ej. new"
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-[var(--wa-text)]"
            />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
            <div>
              <label htmlFor="ldf" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--wa-text-muted)]">
                Desde
              </label>
              <input
                id="ldf"
                name="date_from"
                type="date"
                defaultValue={date_from ?? ""}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/35 px-2 py-2 text-xs text-[var(--wa-text)]"
              />
            </div>
            <div>
              <label htmlFor="ldt" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--wa-text-muted)]">
                Hasta
              </label>
              <input
                id="ldt"
                name="date_to"
                type="date"
                defaultValue={date_to ?? ""}
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/35 px-2 py-2 text-xs text-[var(--wa-text)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--wa-accent)]/25 px-4 py-2 text-sm font-semibold text-[var(--wa-accent-soft)] hover:bg-[var(--wa-accent)]/35"
            >
              Filtrar
            </button>
            {hasFilters ? (
              <Link
                href="/leads"
                className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-[var(--wa-text-muted)] hover:bg-white/5"
              >
                Limpiar
              </Link>
            ) : null}
          </div>
        </form>

        {err ? (
          <div className="mt-6 rounded-xl border border-[var(--wa-danger)]/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        ) : null}

        {!err && rows.length === 0 ? (
          <div className="mt-8 max-w-xl rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-5 text-sm text-[var(--wa-text)] shadow-lg">
            <p className="font-medium text-[var(--wa-text)]">Aún no hay leads</p>
            <p className="mt-2 text-[var(--wa-text-muted)]">
              El panel solo muestra filas cuando el modelo <strong className="text-[var(--wa-text)]">guarda</strong>{" "}
              datos con la herramienta del CRM, no por cada mensaje suelto.
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--wa-text-muted)]">
              <li>
                Configura clave de OpenAI o Gemini en{" "}
                <Link href="/configuracion" className="font-medium text-[var(--wa-link)] underline">
                  Ajustes
                </Link>{" "}
                (sección 3 y 4).
              </li>
              <li>
                Desde tu celular, escribe al WhatsApp del negocio dejando datos claros (nombre, ciudad, qué buscas,
                correo).
              </li>
              <li>Vuelve aquí y recarga la página: debería aparecer una fila con tu número.</li>
            </ol>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--wa-text-muted)]">
                Mostrando {rows.length} fila{rows.length === 1 ? "" : "s"} (máx. 300 con los filtros actuales).
              </p>
              <LeadsExportButton rows={rows} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] shadow-xl">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--wa-border)] bg-black/25 text-[var(--wa-text-muted)]">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Extra</th>
                  <th className="px-4 py-3 font-medium">Actualizado</th>
                  <th className="px-4 py-3 font-medium">Chat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--wa-border)]/60 transition hover:bg-[var(--wa-panel-hover)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--wa-text)]">
                      {r.name ?? <span className="text-[var(--wa-text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--wa-text)]">{r.phone}</td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[var(--wa-text)]">
                      {r.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--wa-accent)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--wa-accent-soft)]">
                        {r.stage}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 align-top">
                      <QualSummary q={r.qualification} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--wa-text-muted)]">
                      {formatDate(r.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/chats/${r.conversation_id}`}
                        className="font-medium text-[var(--wa-link)] underline-offset-2 hover:underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
