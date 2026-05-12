"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type LlmProvider = "openai" | "gemini";

type Settings = {
  twilio_account_sid: string;
  webhook_base_url: string;
  twilio_validate_signature: boolean;
  llm_provider: LlmProvider;
  openai_model: string;
  gemini_model: string;
  twilio_auth_token_configured: boolean;
  openai_api_key_configured: boolean;
  gemini_api_key_configured: boolean;
  twilio_webhook_full_url: string;
  agent_business_summary: string;
  agent_instructions: string;
  agent_lead_capture: string;
  agent_catalog: string;
  agent_pricing_rules: string;
  agent_shipping_zones: string;
  agent_payment_methods: string;
  agent_returns_warranty: string;
  agent_faq: string;
  agent_off_hours_message: string;
  agent_hard_rules: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--wa-border)] bg-[#2a3942] px-3 py-2.5 text-sm text-[var(--wa-text)] shadow-inner placeholder:text-[var(--wa-text-muted)] focus:border-[var(--wa-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--wa-accent)]";

const textareaClass = `${inputClass} min-h-[120px] resize-y leading-relaxed`;

function AgentConfigCard({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--wa-border)]/90 bg-[#151e24]/90 p-4 shadow-inner ring-1 ring-white/[0.04] sm:p-5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-violet-300/90">{step}</p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--wa-text)]">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--wa-text-muted)]">{hint}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** IDs válidos para la API Gemini (Developer); elige según cuotas en Google AI Studio. */
const GEMINI_MODEL_PRESETS: { value: string; label: string }[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (recomendado, plan gratuito típico)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-flash-latest", label: "Gemini Flash (última versión estable)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (más capacidad, cuotas distintas)" },
];

const GEMINI_MODEL_CUSTOM = "__custom__";

function geminiModelSelectValue(model: string): string {
  return GEMINI_MODEL_PRESETS.some((p) => p.value === model) ? model : GEMINI_MODEL_CUSTOM;
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconOpenAI({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-2.5 2.8-4 6.3-4 10a8 8 0 1 0 8-8h-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 3v7m0 4v7M8 9h8M8 15h5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGemini({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `gemini-grad-${uid}`;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 2l1.9 5.7h6l-4.9 3.6 1.9 5.7L12 14.3 6.1 17l1.9-5.7L3.1 7.7h6L12 2z"
      />
    </svg>
  );
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 7.5a3.5 3.5 0 1 0-4.9 4.9L5 18v3h3v-2h2v-2h2l2.6-2.6a3.5 3.5 0 0 0 .9-6.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconChip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M9 9h6M5 7H3m18 4h-5M11 17H3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="8" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
      <path d="M12 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type SettingsTab = "general" | "agent";

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [data, setData] = useState<Settings | null>(null);

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("");
  const [validateSignature, setValidateSignature] = useState(false);
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("openai");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [twilioToken, setTwilioToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [agentBusinessSummary, setAgentBusinessSummary] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [agentLeadCapture, setAgentLeadCapture] = useState("");
  const [agentCatalog, setAgentCatalog] = useState("");
  const [agentPricingRules, setAgentPricingRules] = useState("");
  const [agentShippingZones, setAgentShippingZones] = useState("");
  const [agentPaymentMethods, setAgentPaymentMethods] = useState("");
  const [agentReturnsWarranty, setAgentReturnsWarranty] = useState("");
  const [agentFaq, setAgentFaq] = useState("");
  const [agentOffHoursMessage, setAgentOffHoursMessage] = useState("");
  const [agentHardRules, setAgentHardRules] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [catalogImportMode, setCatalogImportMode] = useState<"append" | "replace">("append");
  const [catalogImporting, setCatalogImporting] = useState(false);
  const catalogFileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/internal/settings", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const j = (await res.json()) as Settings;
      setData(j);
      setTwilioAccountSid(j.twilio_account_sid);
      setWebhookBaseUrl(j.webhook_base_url);
      setValidateSignature(j.twilio_validate_signature);
      setLlmProvider(j.llm_provider === "gemini" ? "gemini" : "openai");
      setOpenaiModel(j.openai_model);
      setGeminiModel(j.gemini_model);
      setTwilioToken("");
      setOpenaiKey("");
      setGeminiKey("");
      setAgentBusinessSummary(j.agent_business_summary ?? "");
      setAgentInstructions(j.agent_instructions ?? "");
      setAgentLeadCapture(j.agent_lead_capture ?? "");
      setAgentCatalog(j.agent_catalog ?? "");
      setAgentPricingRules(j.agent_pricing_rules ?? "");
      setAgentShippingZones(j.agent_shipping_zones ?? "");
      setAgentPaymentMethods(j.agent_payment_methods ?? "");
      setAgentReturnsWarranty(j.agent_returns_warranty ?? "");
      setAgentFaq(j.agent_faq ?? "");
      setAgentOffHoursMessage(j.agent_off_hours_message ?? "");
      setAgentHardRules(j.agent_hard_rules ?? "");
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "No se pudo cargar la configuración",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCatalogFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCatalogImporting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/internal/settings/agent-catalog/parse", {
        method: "POST",
        body: fd,
      });
      const text = await res.text();
      let parsed: {
        detail?: string | { msg?: string }[];
        catalog_fragment?: string;
        rows_imported?: number;
        file_type?: string;
      };
      try {
        parsed = JSON.parse(text) as typeof parsed;
      } catch {
        throw new Error(text.slice(0, 280) || "Error al importar");
      }
      if (!res.ok) {
        const d = parsed.detail;
        const msg =
          typeof d === "string"
            ? d
            : Array.isArray(d)
              ? JSON.stringify(d)
              : text.slice(0, 280);
        throw new Error(msg);
      }
      const fragment = (parsed.catalog_fragment ?? "").trim();
      const n = parsed.rows_imported ?? 0;
      const ft = parsed.file_type ?? "";
      const header = `# Import ${file.name} (${n} filas, ${ft})\n`;
      const mode = catalogImportMode;
      setAgentCatalog((prev) => {
        if (mode === "replace") {
          return `${header}${fragment}`.trim();
        }
        const p = prev.trim();
        if (!p) return `${header}${fragment}`.trim();
        return `${p}\n\n${header}${fragment}`.trim();
      });
      setMessage({
        type: "ok",
        text: `Importadas ${n} filas (${ft}). Revisa el catálogo y pulsa «Guardar configuración».`,
      });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "No se pudo importar el archivo",
      });
    } finally {
      setCatalogImporting(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const geminiModelToSave =
        geminiModelSelectValue(geminiModel) === GEMINI_MODEL_CUSTOM
          ? geminiModel.trim()
          : geminiModel;
      if (llmProvider === "gemini" && !geminiModelToSave) {
        throw new Error(
          "El modelo Gemini no puede estar vacío: elige una opción del listado o escribe un ID en «Otro».",
        );
      }
      const payload: Record<string, unknown> = {
        twilio_account_sid: twilioAccountSid,
        webhook_base_url: webhookBaseUrl,
        twilio_validate_signature: validateSignature,
        llm_provider: llmProvider,
        openai_model: openaiModel,
        gemini_model: geminiModelToSave,
        agent_business_summary: agentBusinessSummary,
        agent_instructions: agentInstructions,
        agent_lead_capture: agentLeadCapture,
        agent_catalog: agentCatalog,
        agent_pricing_rules: agentPricingRules,
        agent_shipping_zones: agentShippingZones,
        agent_payment_methods: agentPaymentMethods,
        agent_returns_warranty: agentReturnsWarranty,
        agent_faq: agentFaq,
        agent_off_hours_message: agentOffHoursMessage,
        agent_hard_rules: agentHardRules,
      };
      if (twilioToken.trim()) {
        payload.twilio_auth_token = twilioToken.trim();
      }
      if (openaiKey.trim()) {
        payload.openai_api_key = openaiKey.trim();
      }
      if (geminiKey.trim()) {
        payload.gemini_api_key = geminiKey.trim();
      }

      const res = await fetch("/api/internal/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const j = (await res.json()) as Settings;
      setData(j);
      setTwilioAccountSid(j.twilio_account_sid);
      setWebhookBaseUrl(j.webhook_base_url);
      setValidateSignature(j.twilio_validate_signature);
      setLlmProvider(j.llm_provider === "gemini" ? "gemini" : "openai");
      setOpenaiModel(j.openai_model);
      setGeminiModel(j.gemini_model);
      setTwilioToken("");
      setOpenaiKey("");
      setGeminiKey("");
      setAgentBusinessSummary(j.agent_business_summary ?? "");
      setAgentInstructions(j.agent_instructions ?? "");
      setAgentLeadCapture(j.agent_lead_capture ?? "");
      setAgentCatalog(j.agent_catalog ?? "");
      setAgentPricingRules(j.agent_pricing_rules ?? "");
      setAgentShippingZones(j.agent_shipping_zones ?? "");
      setAgentPaymentMethods(j.agent_payment_methods ?? "");
      setAgentReturnsWarranty(j.agent_returns_warranty ?? "");
      setAgentFaq(j.agent_faq ?? "");
      setAgentOffHoursMessage(j.agent_off_hours_message ?? "");
      setAgentHardRules(j.agent_hard_rules ?? "");
      setMessage({ type: "ok", text: "Guardado correctamente." });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onClearSecrets() {
    if (
      !confirm(
        "¿Borrar token de Twilio y las claves de OpenAI y Gemini guardadas en la base de datos?",
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/internal/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilio_auth_token: "",
          openai_api_key: "",
          gemini_api_key: "",
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await load();
      setMessage({
        type: "ok",
        text: "Credenciales del panel eliminadas. Se usarán las variables de entorno si existen.",
      });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[var(--wa-bg)] pb-16">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-[var(--wa-text)]">Ajustes</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--wa-text-muted)]">
          Credenciales y comportamiento del bot. Los valores en el panel tienen prioridad sobre el{" "}
          <code className="rounded bg-black/35 px-1.5 py-0.5 text-[var(--wa-text)]">.env</code> de la API.
        </p>

        {message ? (
          <div
            className={
              message.type === "ok"
                ? "mt-4 rounded-xl border border-[var(--wa-accent)]/40 bg-[var(--wa-bubble-out)]/30 px-4 py-3 text-sm text-[var(--wa-text)]"
                : "mt-4 rounded-xl border border-[var(--wa-danger)]/50 bg-red-950/40 px-4 py-3 text-sm text-red-100"
            }
          >
            {message.text}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-[var(--wa-text-muted)]">Cargando…</p>
        ) : (
          <form onSubmit={onSave} className="mt-6">
            <div
              className="flex flex-col gap-2 rounded-2xl border border-[var(--wa-border)] bg-[#1a242b] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:gap-1.5"
              role="tablist"
              aria-label="Secciones de ajustes"
            >
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === "general"}
                id="tab-general"
                onClick={() => setSettingsTab("general")}
                className={[
                  "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
                  settingsTab === "general"
                    ? "bg-[var(--wa-accent)] text-[#041016] shadow-md ring-2 ring-[var(--wa-accent)]/50"
                    : "text-[var(--wa-text-muted)] hover:bg-white/[0.06] hover:text-[var(--wa-text)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    settingsTab === "general" ? "bg-black/12" : "bg-black/30 ring-1 ring-white/10",
                  ].join(" ")}
                  aria-hidden
                >
                  <IconSliders
                    className={`h-5 w-5 ${settingsTab === "general" ? "text-[#041016]" : "text-[var(--wa-text-muted)]"}`}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-sm font-semibold sm:text-base">
                    Configuración general
                  </span>
                  <span
                    className={[
                      "mt-0.5 block text-[11px] leading-snug sm:text-xs",
                      settingsTab === "general" ? "text-[#041016]/85" : "text-[var(--wa-text-muted)]",
                    ].join(" ")}
                  >
                    Twilio, webhook e IA
                  </span>
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={settingsTab === "agent"}
                id="tab-agent"
                onClick={() => setSettingsTab("agent")}
                className={[
                  "flex flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 sm:px-4",
                  settingsTab === "agent"
                    ? "bg-gradient-to-br from-violet-600 to-sky-700 text-white shadow-md ring-2 ring-violet-400/40"
                    : "text-[var(--wa-text-muted)] hover:bg-white/[0.06] hover:text-[var(--wa-text)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    settingsTab === "agent" ? "bg-white/15" : "bg-black/30 ring-1 ring-white/10",
                  ].join(" ")}
                  aria-hidden
                >
                  <IconBot
                    className={`h-5 w-5 ${settingsTab === "agent" ? "text-white" : "text-[var(--wa-text-muted)]"}`}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-display)] text-sm font-semibold sm:text-base">
                    Agente de WhatsApp
                  </span>
                  <span
                    className={[
                      "mt-0.5 block text-[11px] leading-snug sm:text-xs",
                      settingsTab === "agent" ? "text-white/90" : "text-[var(--wa-text-muted)]",
                    ].join(" ")}
                  >
                    Negocio, catálogo, políticas y CRM
                  </span>
                </span>
              </button>
            </div>

            <p className="mt-3 text-center text-xs leading-relaxed text-[var(--wa-text-muted)] sm:text-left">
              <strong className="text-[var(--wa-text)]">Guardar</strong> aplica todo el formulario (general + agente).
              Puedes cambiar de pestaña para revisar antes de enviar.
            </p>

            <div className="mt-8 space-y-8">
              {settingsTab === "general" ? (
                <>
                  <section
                    role="tabpanel"
                    aria-labelledby="tab-general"
                    className="rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-6 shadow-xl sm:p-7"
                  >
                    <h2 className="text-lg font-semibold text-[var(--wa-text)]">Twilio (WhatsApp)</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wa-text-muted)]">
                En{" "}
                <a
                  href="https://console.twilio.com/"
                  className="font-medium text-[var(--wa-link)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  console.twilio.com
                </a>{" "}
                entra a <strong>Messaging → Try it out → WhatsApp sandbox</strong> (o tu canal
                WhatsApp). Ahí verás el <strong>Account SID</strong> y podrás generar o copiar el{" "}
                <strong>Auth Token</strong>.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--wa-text-muted)]">Account SID</label>
                <input
                  className={inputClass}
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxx..."
                  autoComplete="off"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--wa-text-muted)]">Auth Token</label>
                <input
                  className={inputClass}
                  type="password"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder={
                    data?.twilio_auth_token_configured
                      ? "Dejar vacío para no cambiar (ya hay uno guardado)"
                      : "Pega el token de Twilio"
                  }
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-[var(--wa-text-muted)]">
                  Solo se envía al guardar si escribes algo nuevo. No se muestra el valor guardado.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-6 shadow-xl sm:p-7">
              <h2 className="text-lg font-semibold text-[var(--wa-text)]">URL pública del webhook</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wa-text-muted)]">
                Twilio debe poder llamar por HTTPS a tu API. Suele ser la URL de{" "}
                <strong>ngrok</strong>, <strong>Cloudflare Tunnel</strong>, etc.,{" "}
                <strong>sin</strong> el path final (solo el origen, por ejemplo{" "}
                <code className="rounded bg-black/35 px-1.5 py-0.5 text-[var(--wa-text)]">https://abc123.ngrok-free.app</code>).
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--wa-text-muted)]">Webhook base URL</label>
                <input
                  className={inputClass}
                  value={webhookBaseUrl}
                  onChange={(e) => setWebhookBaseUrl(e.target.value)}
                  placeholder="https://tu-tunel.ngrok-free.app"
                />
              </div>
              {data ? (
                <div className="mt-4 rounded-lg bg-black/35 px-3 py-2 font-mono text-xs text-[var(--wa-text)] break-all ring-1 ring-[var(--wa-border)]">
                  <span className="font-sans text-[var(--wa-text-muted)]">Pega esto en Twilio (URL completa):</span>
                  <br />
                  {data.twilio_webhook_full_url}
                </div>
              ) : null}
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--wa-text)]">
                <input
                  type="checkbox"
                  checked={validateSignature}
                  onChange={(e) => setValidateSignature(e.target.checked)}
                  className="rounded border-[var(--wa-border)] bg-[#2a3942] text-[var(--wa-accent)] focus:ring-[var(--wa-accent)]"
                />
                Validar firma de Twilio (X-Twilio-Signature) — desactiva solo para pruebas rápidas
                en local.
              </label>
            </section>

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
                    Un <strong className="text-[var(--wa-text)]">solo</strong> proveedor responde en
                    WhatsApp. Elige OpenAI <em>o</em> Gemini; las dos claves pueden guardarse, pero solo
                    se usa el motor seleccionado. Pulsa <strong className="text-[var(--wa-text)]">Guardar</strong>{" "}
                    al cambiar.
                  </p>
                </div>
              </div>

              <div
                className="mt-6 grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Proveedor de lenguaje (solo uno)"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={llmProvider === "openai"}
                  onClick={() => setLlmProvider("openai")}
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
                    <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">
                      OpenAI
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--wa-text-muted)]">
                      Chat Completions · tools · modelos tipo GPT-4o mini
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={llmProvider === "gemini"}
                  onClick={() => setLlmProvider("gemini")}
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
                    <p className="font-[family-name:var(--font-display)] text-base font-semibold text-white">
                      Google Gemini
                    </p>
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
                    onChange={(e) => setLlmProvider(e.target.value as LlmProvider)}
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
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
                      Credenciales OpenAI
                    </h3>
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
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder={
                        data?.openai_api_key_configured
                          ? "Dejar vacío para no cambiar"
                          : "sk-..."
                      }
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
                      onChange={(e) => setOpenaiModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                    />
                  </div>
                </div>
              ) : null}

              {llmProvider === "gemini" ? (
                <div className="mt-8 rounded-2xl border border-violet-400/35 bg-gradient-to-br from-[#121a22] to-[#0f1419] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-3">
                    <IconGemini className="h-6 w-6 shrink-0" />
                    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-white">
                      Credenciales Gemini
                    </h3>
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
                    <code className="rounded-md bg-black/40 px-1.5 py-0.5 text-[var(--wa-text)]">sk-</code>{" "}
                    de OpenAI.
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
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder={
                        data?.gemini_api_key_configured
                          ? "Dejar vacío para no cambiar"
                          : "Pega la clave de Google AI Studio"
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
                            setGeminiModel("");
                          }
                        } else {
                          setGeminiModel(v);
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
                        onChange={(e) => setGeminiModel(e.target.value)}
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
                        Cada modelo tiene RPM/RPD propios;{" "}
                        <strong className="text-[var(--wa-text)]">2.5 Flash</strong> suele ir bien en
                        gratuito. Si ves{" "}
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
                </>
              ) : (
                <>
                  <section
                    role="tabpanel"
                    aria-labelledby="tab-agent"
                    className="rounded-2xl border border-violet-500/25 bg-[var(--wa-panel)] p-6 shadow-xl ring-1 ring-violet-500/10 sm:p-7"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-600/25 text-white ring-1 ring-white/15">
                        <IconBot className="h-6 w-6" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-[var(--wa-text)]">Personalidad y negocio del bot</h2>
                        <p className="mt-1 text-xs text-[var(--wa-text-muted)] sm:text-sm">
                          Va al <strong className="text-[var(--wa-text)]">prompt del sistema</strong>. Revisa también{" "}
                          <Link href="/leads" className="font-medium text-[var(--wa-link)] underline">
                            Leads
                          </Link>{" "}
                          tras probar en WhatsApp.
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--wa-text-muted)]">
                      El bot ya viene orientado a <strong className="text-[var(--wa-text)]">LATAM</strong> y contexto{" "}
                      <strong className="text-[var(--wa-text)]">peruano</strong> (soles, distritos, RUC/boleta cuando lo
                      indiques). Los registros aparecen en{" "}
                      <Link href="/leads" className="font-medium text-[var(--wa-link)] underline">
                        Leads
                      </Link>{" "}
                      cuando el modelo ejecuta{" "}
                      <code className="rounded bg-black/35 px-1 text-[var(--wa-text)]">save_lead</code>. Cada bloque
                      siguiente se inyecta en el <strong className="text-[var(--wa-text)]">orden mostrado</strong> en el
                      prompt del sistema: sé específico; el modelo tratará el catálogo como fuente de verdad para
                      nombres y precios.
                    </p>
                    <div className="mt-4 rounded-xl border border-[var(--wa-accent)]/30 bg-[var(--wa-accent)]/10 px-4 py-3 text-sm text-[var(--wa-text)]">
                      <p className="font-medium text-[var(--wa-accent-soft)]">Cómo comprobar que los leads funcionan</p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[var(--wa-text-muted)]">
                        <li>
                          En <strong className="text-[var(--wa-text)]">Configuración general</strong>, sección{" "}
                          <strong className="text-[var(--wa-text)]">Motor de IA</strong>: clave y{" "}
                          <strong className="text-[var(--wa-text)]">Guardar</strong>.
                        </li>
                        <li>
                          Escribe al número de WhatsApp del negocio algo como: «Hola, soy Ana de Surco, busco jarras para
                          regalo, mi correo es…».
                        </li>
                        <li>
                          Abre{" "}
                          <Link href="/leads" className="font-medium text-[var(--wa-link)] underline">
                            Leads
                          </Link>{" "}
                          o{" "}
                          <Link href="/chats" className="font-medium text-[var(--wa-link)] underline">
                            Chats
                          </Link>{" "}
                          y recarga: debe aparecer fila con teléfono y datos en «Extra».
                        </li>
                      </ol>
                      <p className="mt-2 text-xs text-[var(--wa-text-muted)]">
                        Si la lista sigue vacía, el modelo no llamó{" "}
                        <code className="rounded bg-black/35 px-1">save_lead</code>: revisa el LLM y refuerza en «CRM /
                        Leads».
                      </p>
                    </div>

                    <div className="mt-6 space-y-5">
                      <AgentConfigCard
                        step="01 · Identidad"
                        title="Qué es tu negocio"
                        hint="Nombre comercial, rubro, público, diferenciales. Una o dos frases también sirven; aquí puedes extenderte."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentBusinessSummary}
                          onChange={(e) => setAgentBusinessSummary(e.target.value)}
                          placeholder="Ej.: Casita — tienda peruana de artículos para el hogar (platos, vasos, jarras); atención B2C y pequeños negocios."
                          rows={4}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="02 · Catálogo"
                        title="Productos, servicios, SKU y precios de referencia"
                        hint="Escribe a mano o importa CSV / Excel (.xlsx): cada fila se convierte en «celda | celda | …». La primera hoja del Excel es la que se lee. Máx. ~3000 filas y 2 MB. Formato .xls antiguo no está soportado (exporta como .xlsx)."
                      >
                        <input
                          ref={catalogFileInputRef}
                          type="file"
                          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          className="sr-only"
                          onChange={(e) => void handleCatalogFileChange(e)}
                        />
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                          <div className="flex rounded-lg border border-[var(--wa-border)] bg-black/30 p-0.5">
                            <button
                              type="button"
                              onClick={() => setCatalogImportMode("append")}
                              className={[
                                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                                catalogImportMode === "append"
                                  ? "bg-[var(--wa-accent)] text-[#041016]"
                                  : "text-[var(--wa-text-muted)] hover:text-[var(--wa-text)]",
                              ].join(" ")}
                            >
                              Añadir al final
                            </button>
                            <button
                              type="button"
                              onClick={() => setCatalogImportMode("replace")}
                              className={[
                                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                                catalogImportMode === "replace"
                                  ? "bg-amber-500/90 text-[#041016]"
                                  : "text-[var(--wa-text-muted)] hover:text-[var(--wa-text)]",
                              ].join(" ")}
                            >
                              Reemplazar todo
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={catalogImporting}
                            onClick={() => catalogFileInputRef.current?.click()}
                            className="rounded-lg border border-violet-500/40 bg-violet-950/40 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-900/50 disabled:opacity-50"
                          >
                            {catalogImporting ? "Importando…" : "Importar CSV o Excel…"}
                          </button>
                          <span className="text-xs text-[var(--wa-text-muted)]">
                            «Reemplazar» borra el texto actual del catálogo y deja solo lo importado (más la línea
                            # Import).
                          </span>
                        </div>
                        <textarea
                          className={`${textareaClass} mt-3 min-h-[200px]`}
                          value={agentCatalog}
                          onChange={(e) => setAgentCatalog(e.target.value)}
                          placeholder={`CAS-JAR-01 | Jarra vidrio 1L | S/ 24.90 | stock variable\nCAS-PLA-12 | Set platos x4 | S/ 89 | solo blanco`}
                          rows={10}
                          spellCheck={false}
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="03 · Precisión de precios"
                        title="Reglas de cotización, IGV y redondeos"
                        hint="Ej.: precios públicos incluyen IGV; no des descuentos no listados; si el monto no está en catálogo di «te confirmo con el equipo»."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentPricingRules}
                          onChange={(e) => setAgentPricingRules(e.target.value)}
                          placeholder="Ej.: Todos los montos del catálogo incluyen IGV. No prometas descuentos. Si piden volumen mayor a 50 unidades, deriva a humano."
                          rows={5}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="04 · Envíos"
                        title="Zonas, costos y tiempos de entrega"
                        hint="Lima / provincias, contraentrega, recojo en tienda, courier, plazos hábiles."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentShippingZones}
                          onChange={(e) => setAgentShippingZones(e.target.value)}
                          placeholder="Ej.: Lima metropolitana delivery 24–48 h hábiles (S/ 8–15 según distrito). Provincias: 3–7 días vía Olva; no enviamos a ciertas zonas sin acuerdo previo."
                          rows={5}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="05 · Pagos"
                        title="Medios y condiciones de pago"
                        hint="Yape, transferencia, POS, cuotas, link de pago, señal para pedidos grandes."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentPaymentMethods}
                          onChange={(e) => setAgentPaymentMethods(e.target.value)}
                          placeholder="Ej.: Yape/plin al número XXXX; transferencia BCP/Interbank; no aceptamos crypto; pedidos &gt; S/ 500 requieren 30% adelanto."
                          rows={4}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="06 · Postventa"
                        title="Cambios, devoluciones y garantía"
                        hint="Plazos, estado del producto, comprobante obligatorio, exclusiones."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentReturnsWarranty}
                          onChange={(e) => setAgentReturnsWarranty(e.target.value)}
                          placeholder="Ej.: Cambios por defecto de fábrica 7 días con boleta y empaque; no devolución por arrepentimiento salvo acuerdo; vajilla usada no aplica."
                          rows={4}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="07 · FAQs"
                        title="Preguntas frecuentes (respuestas cortas)"
                        hint="Formato: P: … / R: … (una por bloque). El bot puede copiar o adaptar estas respuestas."
                      >
                        <textarea
                          className={`${textareaClass} min-h-[180px]`}
                          value={agentFaq}
                          onChange={(e) => setAgentFaq(e.target.value)}
                          placeholder={`P: ¿Hacen factura?\nR: Sí, con RUC y razón social.\n\nP: ¿Venden al mayor?\nR: Sí, desde 24 unidades; pedir cotización.`}
                          rows={8}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="08 · Horarios"
                        title="Mensaje fuera de horario o cuando no hay cobertura"
                        hint="Si dejas esto vacío, el bot solo usará las instrucciones generales. Úsalo para plantilla fija fuera de 9–18, feriados, etc."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentOffHoursMessage}
                          onChange={(e) => setAgentOffHoursMessage(e.target.value)}
                          placeholder="Ej.: Gracias por escribir a Casita. Estamos fuera de horario (lun–sáb 9–18). Te respondemos al abrir con tu pedido o consulta."
                          rows={4}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="09 · Límites estrictos"
                        title="Lo que el bot nunca debe hacer o decir"
                        hint="Legal, salud, promesas imposibles, competencia desleal, datos sensibles. Aquí va lo «innegociable»."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentHardRules}
                          onChange={(e) => setAgentHardRules(e.target.value)}
                          placeholder="Ej.: No dar asesoría legal/médica; no garantizar fechas de courier; no insultar a la competencia; no pedir claves bancarias."
                          rows={4}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="10 · Tono y estilo"
                        title="Instrucciones generales (saludo, emojis, formalidad)"
                        hint="Complementa lo anterior: voseo/tuteo, uso de emojis, longitud de mensajes, cómo cerrar venta."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentInstructions}
                          onChange={(e) => setAgentInstructions(e.target.value)}
                          placeholder="Ej.: Tono cercano peruano, tuteo, 1–3 oraciones por mensaje; un emoji máximo si aplica; si piden factura pedir RUC y correo de envío de XML."
                          rows={5}
                          spellCheck
                        />
                      </AgentConfigCard>

                      <AgentConfigCard
                        step="11 · CRM / Leads"
                        title="Qué datos debe pedir y cuándo guardar"
                        hint="El modelo usa save_lead: nombre, email, empresa, ciudad, producto/servicio, presupuesto, notas. Indica prioridad y cuándo llamar a la herramienta."
                      >
                        <textarea
                          className={textareaClass}
                          value={agentLeadCapture}
                          onChange={(e) => setAgentLeadCapture(e.target.value)}
                          placeholder="Ej.: Siempre pedir distrito y correo para cotización; tras nombre + interés llamar save_lead; actualizar si cambian cantidad o producto."
                          rows={5}
                          spellCheck
                        />
                        <p className="mt-2 text-xs text-[var(--wa-text-muted)]">
                          Cada llamada a{" "}
                          <code className="rounded bg-black/35 px-1">save_lead</code> fusiona con el lead del mismo chat.
                        </p>
                      </AgentConfigCard>
                    </div>
            </section>
                </>
              )}

            {settingsTab === "general" ? (
              <section className="rounded-2xl border border-amber-500/35 bg-amber-950/35 p-4 text-sm text-amber-50">
                <strong>Importante:</strong> guardar secretos en PostgreSQL es cómodo para
                desarrollo; en producción valora cifrar, usar un vault o solo variables de entorno.
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--wa-accent)] px-6 py-2.5 text-sm font-semibold text-[#041016] shadow-lg transition hover:bg-[var(--wa-accent-soft)] disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar configuración"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void load()}
                className="rounded-full border border-[var(--wa-border)] bg-[var(--wa-panel-hover)] px-5 py-2.5 text-sm font-medium text-[var(--wa-text)] transition hover:bg-[#3b4a54] disabled:opacity-50"
              >
                Recargar
              </button>
              {settingsTab === "general" ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onClearSecrets()}
                  className="rounded-full border border-red-500/50 bg-red-950/40 px-5 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-950/60 disabled:opacity-50"
                >
                  Borrar tokens del panel
                </button>
              ) : null}
            </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
