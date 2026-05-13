"use client";

import { useCallback, useEffect, useState } from "react";

type StatusPayload = {
  api_version: string;
  git_commit: string;
  database: string;
  redis_configured: boolean;
};

export default function EstadoPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rid, setRid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/internal/status", { cache: "no-store" });
      const id = res.headers.get("X-Request-ID");
      if (id) setRid(id);
      const j = (await res.json()) as { detail?: unknown } & Partial<StatusPayload>;
      if (!res.ok) {
        const d = j.detail;
        setData(null);
        setErr(typeof d === "string" ? d : JSON.stringify(d));
        return;
      }
      setData(j as StatusPayload);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Error de red");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-[var(--wa-text)]">Estado del despliegue</h1>
      <p className="mt-2 text-sm text-[var(--wa-text-muted)]">
        Lectura del panel vía BFF (<code className="rounded bg-black/30 px-1">/api/internal/status</code>) con la
        misma clave interna que el resto de rutas.
      </p>
      {rid ? (
        <p className="mt-3 font-mono text-xs text-[var(--wa-text-muted)]">
          X-Request-ID: <span className="text-[var(--wa-text)]">{rid}</span>
        </p>
      ) : null}
      {err ? (
        <p className="mt-6 rounded-xl border border-[var(--wa-danger)]/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {err}
        </p>
      ) : null}
      {data ? (
        <dl className="mt-8 space-y-4 rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--wa-text-muted)]">API</dt>
            <dd className="font-mono text-[var(--wa-text)]">{data.api_version}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--wa-text-muted)]">Git commit</dt>
            <dd className="break-all font-mono text-[var(--wa-text)]">{data.git_commit}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--wa-text-muted)]">Base de datos</dt>
            <dd className="text-[var(--wa-accent-soft)]">{data.database}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--wa-text-muted)]">Redis (rate limit distribuido)</dt>
            <dd className="text-[var(--wa-text)]">{data.redis_configured ? "configurado" : "no (memoria local)"}</dd>
          </div>
        </dl>
      ) : !err ? (
        <p className="mt-8 text-sm text-[var(--wa-text-muted)]">Cargando…</p>
      ) : null}
      <button
        type="button"
        onClick={() => void load()}
        className="mt-8 rounded-full border border-[var(--wa-border)] bg-[var(--wa-panel-hover)] px-5 py-2 text-sm font-medium text-[var(--wa-text)] transition hover:bg-[#3b4a54]"
      >
        Recargar
      </button>
    </div>
  );
}
