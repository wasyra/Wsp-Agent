"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { waAvatarGlyph, waAvatarHue, waChatTitle } from "@/lib/wa-display";

const FILTER_KEYS = ["q", "status", "date_from", "date_to"] as const;

export type ChatSidebarRow = {
  id: string;
  twilio_from: string;
  status: string;
  updated_at: string;
  message_count: number;
  last_agent_llm_status: string;
};

function activeConversationId(pathname: string): string | null {
  const m = pathname.match(/^\/chats\/([^/]+)$/);
  return m ? m[1] : null;
}

function filterQueryString(sp: URLSearchParams): string {
  const n = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = sp.get(k);
    if (v != null && v.trim() !== "") n.set(k, v.trim());
  }
  const s = n.toString();
  return s ? `?${s}` : "";
}

export function ChatShell({
  initialRows,
  children,
}: {
  initialRows: ChatSidebarRow[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = activeConversationId(pathname);

  const fq = useMemo(() => filterQueryString(searchParams), [searchParams]);
  const [rows, setRows] = useState<ChatSidebarRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setDateFrom(searchParams.get("date_from") ?? "");
    setDateTo(searchParams.get("date_to") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!fq) {
      setRows(initialRows);
      setFetchErr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchErr(null);
      try {
        const qs = new URLSearchParams(fq.slice(1));
        qs.set("limit", "100");
        const res = await fetch(`/api/internal/conversations?${qs}`, { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as ChatSidebarRow[];
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setFetchErr(e instanceof Error ? e.message : "Error al filtrar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fq, initialRows]);

  const applyFilters = useCallback(() => {
    const n = new URLSearchParams();
    if (q.trim()) n.set("q", q.trim());
    if (status.trim()) n.set("status", status.trim());
    if (dateFrom.trim()) n.set("date_from", dateFrom.trim());
    if (dateTo.trim()) n.set("date_to", dateTo.trim());
    const s = n.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  }, [dateFrom, dateTo, pathname, q, router, status]);

  const clearFilters = useCallback(() => {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    router.replace(pathname);
  }, [pathname, router]);

  const tailQs = fq || "";

  return (
    <div className="flex h-[calc(100vh-52px)] min-h-0 flex-col bg-[var(--wa-bg-elevated)] md:flex-row">
      <aside className="wa-sidebar flex max-h-[55vh] shrink-0 flex-col border-[var(--wa-border)] md:max-h-none md:h-full md:w-[min(100%,22rem)] md:max-w-[40vw] md:border-b-0 md:border-r">
        <div className="border-b border-white/[0.06] bg-gradient-to-br from-[#1a262d] to-[#111b21] px-4 py-3.5">
          <h2 className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-white">
            Conversaciones
          </h2>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--wa-text-muted)]">
            {loading ? "Cargando…" : `${rows.length} chat${rows.length === 1 ? "" : "s"}`} · Twilio
          </p>
          <div className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-black/25 p-2.5">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Teléfono o nombre…"
              className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-xs text-[var(--wa-text)] placeholder:text-[var(--wa-text-muted)] focus:border-[var(--wa-accent)]/50 focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5 text-xs text-[var(--wa-text)] focus:outline-none"
            >
              <option value="">Estado (todos)</option>
              <option value="open">open</option>
              <option value="handed_off">handed_off</option>
              <option value="closed">closed</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="min-w-0 rounded-lg border border-white/[0.08] bg-black/30 px-1 py-1 text-[10px] text-[var(--wa-text)] focus:outline-none"
                title="Desde (UTC)"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="min-w-0 rounded-lg border border-white/[0.08] bg-black/30 px-1 py-1 text-[10px] text-[var(--wa-text)] focus:outline-none"
                title="Hasta (UTC)"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 rounded-lg bg-[var(--wa-accent)]/25 px-2 py-1.5 text-[11px] font-semibold text-[var(--wa-accent-soft)] transition hover:bg-[var(--wa-accent)]/35"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] text-[var(--wa-text-muted)] transition hover:bg-white/5"
              >
                Limpiar
              </button>
            </div>
          </div>
          {fetchErr ? (
            <p className="mt-2 text-[10px] leading-snug text-[var(--wa-danger)]">{fetchErr}</p>
          ) : null}
        </div>
        <nav className="wa-scroll flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs leading-relaxed text-[var(--wa-text-muted)]">
              {fq ? "Ningún chat coincide con el filtro." : "Aún no hay mensajes."}
              {!fq ? (
                <>
                  <br />
                  <span className="mt-2 inline-block text-[var(--wa-accent-soft)]">Sandbox → webhook</span>
                </>
              ) : null}
            </div>
          ) : (
            <ul className="py-1">
              {rows.map((r) => {
                const title = waChatTitle(r.twilio_from);
                const glyph = waAvatarGlyph(r.twilio_from);
                const hue = waAvatarHue(r.twilio_from);
                const isActive = r.id === activeId;
                const when = new Date(r.updated_at);
                const timeStr =
                  when.toDateString() === new Date().toDateString()
                    ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                    : when.toLocaleDateString(undefined, { day: "numeric", month: "short" });
                const llmBad = (r.last_agent_llm_status || "ok").toLowerCase() !== "ok";
                const llmLabel = llmBad ? "ERR" : "OK";

                return (
                  <li key={r.id}>
                    <Link
                      href={`/chats/${r.id}${tailQs}`}
                      scroll={false}
                      className={[
                        "group flex items-center gap-3 px-3 py-2.5 transition-all duration-200 md:px-3.5",
                        isActive
                          ? "border-l-[3px] border-[var(--wa-accent)] bg-gradient-to-r from-[#00a884]/12 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          : "border-l-[3px] border-transparent hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg ring-1 ring-white/10 transition group-hover:ring-[var(--wa-accent)]/40"
                        style={{
                          background: `linear-gradient(145deg, hsl(${hue},58%,44%), hsl(${(hue + 42) % 360},52%,30%))`,
                        }}
                        aria-hidden
                      >
                        {glyph}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-[14px] font-medium ${isActive ? "text-white" : "text-[var(--wa-text)]"}`}
                          >
                            {title}
                          </span>
                          <time className="shrink-0 text-[10px] font-medium tabular-nums text-[var(--wa-text-muted)]">
                            {timeStr}
                          </time>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-[var(--wa-text-muted)]">
                          <span
                            className={
                              r.status === "open"
                                ? "mr-0.5 inline-block rounded-full bg-[var(--wa-accent)]/25 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[var(--wa-accent-soft)]"
                                : "mr-0.5 text-[10px] uppercase text-[var(--wa-text-muted)]"
                            }
                          >
                            {r.status}
                          </span>
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide"
                            style={{
                              color: llmBad ? "#fecaca" : "#6ee7b7",
                              background: llmBad ? "rgba(127,29,29,0.35)" : "rgba(6,78,59,0.35)",
                            }}
                            title={llmBad ? "Última respuesta del agente: error de LLM" : "LLM: ok"}
                          >
                            {llmLabel}
                          </span>
                          <span className="truncate">{r.message_count} mensajes</span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--wa-bg)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,168,132,0.12),transparent_55%)]" />
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
