import { IconBot, IconSliders } from "./configuracion-icons";
import type { SettingsTab } from "./configuracion-types";

export function SettingsTabBar({
  tab,
  onTabChange,
}: {
  tab: SettingsTab;
  onTabChange: (t: SettingsTab) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-2xl border border-[var(--wa-border)] bg-[#1a242b] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:gap-1.5"
      role="tablist"
      aria-label="Secciones de ajustes"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "general"}
        id="tab-general"
        onClick={() => onTabChange("general")}
        className={[
          "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
          tab === "general"
            ? "bg-[var(--wa-accent)] text-[#041016] shadow-md ring-2 ring-[var(--wa-accent)]/50"
            : "text-[var(--wa-text-muted)] hover:bg-white/[0.06] hover:text-[var(--wa-text)]",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tab === "general" ? "bg-black/12" : "bg-black/30 ring-1 ring-white/10",
          ].join(" ")}
          aria-hidden
        >
          <IconSliders
            className={`h-5 w-5 ${tab === "general" ? "text-[#041016]" : "text-[var(--wa-text-muted)]"}`}
          />
        </span>
        <span className="min-w-0">
          <span className="block font-[family-name:var(--font-display)] text-sm font-semibold sm:text-base">
            Configuración general
          </span>
          <span
            className={[
              "mt-0.5 block text-[11px] leading-snug sm:text-xs",
              tab === "general" ? "text-[#041016]/85" : "text-[var(--wa-text-muted)]",
            ].join(" ")}
          >
            Twilio, webhook e IA
          </span>
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "agent"}
        id="tab-agent"
        onClick={() => onTabChange("agent")}
        className={[
          "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
          tab === "agent"
            ? "bg-gradient-to-br from-violet-600 to-sky-700 text-white shadow-md ring-2 ring-violet-400/40"
            : "text-[var(--wa-text-muted)] hover:bg-white/[0.06] hover:text-[var(--wa-text)]",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tab === "agent" ? "bg-white/15" : "bg-black/30 ring-1 ring-white/10",
          ].join(" ")}
          aria-hidden
        >
          <IconBot className={`h-5 w-5 ${tab === "agent" ? "text-white" : "text-[var(--wa-text-muted)]"}`} />
        </span>
        <span className="min-w-0">
          <span className="block font-[family-name:var(--font-display)] text-sm font-semibold sm:text-base">
            Agente de WhatsApp
          </span>
          <span
            className={[
              "mt-0.5 block text-[11px] leading-snug sm:text-xs",
              tab === "agent" ? "text-white/90" : "text-[var(--wa-text-muted)]",
            ].join(" ")}
          >
            Negocio, catálogo, políticas y CRM
          </span>
        </span>
      </button>
    </div>
  );
}
