import {
  GEMINI_MODEL_CUSTOM,
  GEMINI_MODEL_PRESETS,
  geminiModelSelectValue,
  inputClass,
} from "./configuracion-constants";
import { IconChip, IconGemini, IconKey, IconOpenAI, IconSpark } from "./configuracion-icons";
import type { LlmProvider, Settings } from "./configuracion-types";

export function LlmMotorSection({
  llmProvider,
  onLlmProvider,
  openaiKey,
  onOpenaiKey,
  openaiModel,
  onOpenaiModel,
  geminiKey,
  onGeminiKey,
  geminiModel,
  onGeminiModel,
  data,
}: {
  llmProvider: LlmProvider;
  onLlmProvider: (p: LlmProvider) => void;
  openaiKey: string;
  onOpenaiKey: (v: string) => void;
  openaiModel: string;
  onOpenaiModel: (v: string) => void;
  geminiKey: string;
  onGeminiKey: (v: string) => void;
  geminiModel: string;
  onGeminiModel: (v: string) => void;
  data: Settings | null;
}) {
  return (
    <section className="rounded-2xl border border-[var(--wa-border)] bg-gradient-to-b from-[var(--wa-panel)] to-[#1a2329] p-6 shadow-2xl ring-1 ring-white/[0.04] sm:p-7">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--wa-accent)]/20 text-[var(--wa-accent-soft)] shadow-inner ring-1 ring-[var(--wa-accent)]/25">
          <IconSpark className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white sm:text-xl">
            Motor de IA
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--wa-text-muted)] sm:text-sm">
            Un <strong className="text-[var(--wa-text)]">solo</strong> proveedor responde en WhatsApp. Elige OpenAI{" "}
            <em>o</em> Gemini; las dos claves pueden guardarse, pero solo se usa el motor seleccionado. Pulsa{" "}
            <strong className="text-[var(--wa-text)]">Guardar</strong> al cambiar.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Proveedor de lenguaje (solo uno)">
        <button
          type="button"
          role="radio"
          aria-checked={llmProvider === "openai"}
          onClick={() => onLlmProvider("openai")}
          className={[
            "group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5",
            llmProvider === "openai"
              ? "border-[var(--wa-accent)] bg-[#00a884]/10 shadow-[0_0_0_1px_rgba(0,168,132,0.35),0_12px_40px_rgba(0,0,0,0.35)] ring-2 ring-[var(--wa-accent)]/50"
              : "border-[var(--wa-border)] bg-black/20 hover:border-white/20 hover:bg-white/[0.04]",
          ].join(" ")}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
              <IconOpenAI className="h-6 w-6" />
            </span>
            {llmProvider === "openai" ? (
              <span className="rounded-full bg-[var(--wa-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#041016]">
                Activo
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--wa-text-muted)]">
                Inactivo
              </span>
            )}
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">OpenAI</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--wa-text-muted)]">
              Chat Completions · tools · modelos tipo GPT-4o mini
            </p>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={llmProvider === "gemini"}
          onClick={() => onLlmProvider("gemini")}
          className={[
            "group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5",
            llmProvider === "gemini"
              ? "border-[#a78bfa] bg-gradient-to-br from-violet-500/15 to-sky-500/10 shadow-[0_0_0_1px_rgba(167,139,250,0.4),0_12px_40px_rgba(0,0,0,0.35)] ring-2 ring-violet-400/40"
              : "border-[var(--wa-border)] bg-black/20 hover:border-white/20 hover:bg-white/[0.04]",
          ].join(" ")}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 ring-1 ring-white/10">
              <IconGemini className="h-7 w-7" />
            </span>
            {llmProvider === "gemini" ? (
              <span className="rounded-full bg-gradient-to-r from-sky-400 to-violet-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0b141a]">
                Activo
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--wa-text-muted)]">
                Inactivo
              </span>
            )}
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">Google Gemini</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--wa-text-muted)]">
              Google AI Studio · tools · modelos Flash / Pro
            </p>
          </div>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-2 text-[11px] text-[var(--wa-text-muted)]">
        <span className="text-base" aria-hidden>
          ℹ️
        </span>
        <span>
          También puedes cambiar de proveedor desde el menú desplegable:{" "}
          <label htmlFor="llm-provider-select" className="sr-only">
            Proveedor (lista)
          </label>
          <select
            id="llm-provider-select"
            value={llmProvider}
            onChange={(e) => onLlmProvider(e.target.value as LlmProvider)}
            className="ml-1 inline-block max-w-[11rem] rounded-lg border border-[var(--wa-border)] bg-[#2a3942] px-2 py-1 text-[11px] font-medium text-[var(--wa-text)] focus:border-[var(--wa-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--wa-accent)]"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </span>
      </div>

      {llmProvider === "openai" ? (
        <div className="mt-8 rounded-2xl border border-[var(--wa-accent)]/40 bg-[#0d151a]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
            <IconOpenAI className="h-5 w-5 text-[var(--wa-accent-soft)]" />
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">Credenciales OpenAI</h3>
          </div>
          <p className="mt-3 text-xs text-[var(--wa-text-muted)]">
            Clave en{" "}
            <a
              href="https://platform.openai.com/api-keys"
              className="inline-flex items-center gap-1 font-medium text-[var(--wa-link)] underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              platform.openai.com/api-keys
            </a>
            . Suele empezar por{" "}
            <code className="rounded-md bg-black/40 px-1.5 py-0.5 text-[var(--wa-text)]">sk-</code>.
          </p>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--wa-text-muted)]">
              <IconKey className="h-4 w-4 shrink-0 text-[var(--wa-text-muted)]" />
              API Key
            </label>
            <input
              className={inputClass}
              type="password"
              value={openaiKey}
              onChange={(e) => onOpenaiKey(e.target.value)}
              placeholder={data?.openai_api_key_configured ? "Dejar vacío para no cambiar" : "sk-..."}
              autoComplete="off"
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--wa-text-muted)]">
              <IconChip className="h-4 w-4 shrink-0 text-[var(--wa-text-muted)]" />
              Modelo
            </label>
            <input
              className={inputClass}
              value={openaiModel}
              onChange={(e) => onOpenaiModel(e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>
        </div>
      ) : null}

      {llmProvider === "gemini" ? (
        <div className="mt-8 rounded-2xl border border-violet-400/35 bg-gradient-to-br from-[#121a22] to-[#0f1419] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
            <IconGemini className="h-6 w-6 shrink-0" />
            <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">Credenciales Gemini</h3>
          </div>
          <p className="mt-3 text-xs text-[var(--wa-text-muted)]">
            Crea una clave en{" "}
            <a
              href="https://aistudio.google.com/apikey"
              className="inline-flex items-center gap-1 font-medium text-[var(--wa-link)] underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
            . No es el formato{" "}
            <code className="rounded-md bg-black/40 px-1.5 py-0.5 text-[var(--wa-text)]">sk-</code> de OpenAI.
          </p>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--wa-text-muted)]">
              <IconKey className="h-4 w-4 shrink-0 text-[var(--wa-text-muted)]" />
              API Key
            </label>
            <input
              className={inputClass}
              type="password"
              value={geminiKey}
              onChange={(e) => onGeminiKey(e.target.value)}
              placeholder={
                data?.gemini_api_key_configured ? "Dejar vacío para no cambiar" : "Pega la clave de Google AI Studio"
              }
              autoComplete="off"
            />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--wa-text-muted)]">
              <IconChip className="h-4 w-4 shrink-0 text-[var(--wa-text-muted)]" />
              Modelo
            </label>
            <select
              className={inputClass}
              value={geminiModelSelectValue(geminiModel)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === GEMINI_MODEL_CUSTOM) {
                  if (GEMINI_MODEL_PRESETS.some((p) => p.value === geminiModel)) {
                    onGeminiModel("");
                  }
                } else {
                  onGeminiModel(v);
                }
              }}
            >
              {GEMINI_MODEL_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value={GEMINI_MODEL_CUSTOM}>Otro (escribir ID del modelo)…</option>
            </select>
            {geminiModelSelectValue(geminiModel) === GEMINI_MODEL_CUSTOM ? (
              <input
                className={`${inputClass} mt-2`}
                value={geminiModel}
                onChange={(e) => onGeminiModel(e.target.value)}
                placeholder="p. ej. gemini-2.5-flash-preview-05-20"
                spellCheck={false}
                autoComplete="off"
              />
            ) : null}
            <p className="mt-2 flex flex-wrap items-start gap-1.5 text-xs leading-relaxed text-[var(--wa-text-muted)]">
              <span className="mt-0.5 text-sm" aria-hidden>
                📊
              </span>
              <span>
                Cada modelo tiene RPM/RPD propios; <strong className="text-[var(--wa-text)]">2.5 Flash</strong> suele ir
                bien en gratuito. Si ves{" "}
                <code className="rounded-md bg-black/40 px-1 py-0.5 text-[var(--wa-text)]">limit: 0</code>, revisa{" "}
                <a
                  href="https://ai.google.dev/gemini-api/docs/rate-limits"
                  className="font-medium text-[var(--wa-link)] underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  rate limits
                </a>
                .
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
