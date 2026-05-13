"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wsp_agent_ui_tour_v1_done";

const steps = [
  {
    title: "Chats",
    body: "Aquí ves conversaciones de WhatsApp (Twilio). La lista se actualiza sola cada pocos segundos y al volver a esta pestaña.",
    href: "/chats",
  },
  {
    title: "Leads",
    body: "Prospectos que el bot guardó con la herramienta CRM. Puedes exportar la tabla a CSV.",
    href: "/leads",
  },
  {
    title: "Ajustes",
    body: "Twilio, motor de IA y texto del agente. Si ves error de LLM en un chat, revisa claves y modelo aquí.",
    href: "/configuracion",
  },
  {
    title: "Estado",
    body: "Comprueba versión, base de datos y Redis desde el panel.",
    href: "/estado",
  },
] as const;

export function AppTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const close = useCallback((markDone: boolean) => {
    if (markDone) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }, []);

  if (!open) return null;

  const s = steps[step]!;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 pb-8 sm:items-center sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--wa-border)] bg-[#1a242b] p-5 shadow-2xl ring-1 ring-white/10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--wa-accent-soft)]">
          Tour rápido · {step + 1}/{steps.length}
        </p>
        <h2 id="tour-title" className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
          {s.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--wa-text-muted)]">{s.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={s.href}
            className="rounded-lg bg-[var(--wa-accent)] px-4 py-2 text-sm font-semibold text-[#041016]"
            onClick={() => close(true)}
          >
            Ir a {s.title}
          </Link>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
              onClick={() => setStep((x) => x + 1)}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
              onClick={() => close(true)}
            >
              Listo
            </button>
          )}
          <button
            type="button"
            className="ml-auto text-xs text-[var(--wa-text-muted)] underline"
            onClick={() => close(true)}
          >
            Cerrar y no volver a mostrar
          </button>
        </div>
      </div>
    </div>
  );
}
