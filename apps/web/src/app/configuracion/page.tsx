"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AgentPersonalityPanel } from "./agent-personality-panel";
import { ConfiguracionFlash } from "./configuracion-flash";
import { ConfiguracionFormActions } from "./configuracion-form-actions";
import { GEMINI_MODEL_CUSTOM, geminiModelSelectValue } from "./configuracion-constants";
import type { LlmProvider, Settings, SettingsTab } from "./configuracion-types";
import { LlmMotorSection } from "./llm-motor-section";
import { SettingsTabBar } from "./settings-tab-bar";
import { TwilioWhatsappSection } from "./twilio-whatsapp-section";
import { WebhookUrlSection } from "./webhook-url-section";

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

        <ConfiguracionFlash message={message} />

        {loading ? (
          <p className="mt-8 text-sm text-[var(--wa-text-muted)]">Cargando…</p>
        ) : (
          <form onSubmit={onSave} className="mt-6">
            <SettingsTabBar tab={settingsTab} onTabChange={setSettingsTab} />

            <p className="mt-3 text-center text-xs leading-relaxed text-[var(--wa-text-muted)] sm:text-left">
              <strong className="text-[var(--wa-text)]">Guardar</strong> aplica todo el formulario (general + agente).
              Puedes cambiar de pestaña para revisar antes de enviar.
            </p>

            <div className="mt-8 space-y-8">
              {settingsTab === "general" ? (
                <>
                  <TwilioWhatsappSection
                    twilioAccountSid={twilioAccountSid}
                    onTwilioAccountSid={setTwilioAccountSid}
                    twilioToken={twilioToken}
                    onTwilioToken={setTwilioToken}
                    data={data}
                  />
                  <WebhookUrlSection
                    webhookBaseUrl={webhookBaseUrl}
                    onWebhookBaseUrl={setWebhookBaseUrl}
                    validateSignature={validateSignature}
                    onValidateSignature={setValidateSignature}
                    data={data}
                  />
                  <LlmMotorSection
                    llmProvider={llmProvider}
                    onLlmProvider={setLlmProvider}
                    openaiKey={openaiKey}
                    onOpenaiKey={setOpenaiKey}
                    openaiModel={openaiModel}
                    onOpenaiModel={setOpenaiModel}
                    geminiKey={geminiKey}
                    onGeminiKey={setGeminiKey}
                    geminiModel={geminiModel}
                    onGeminiModel={setGeminiModel}
                    data={data}
                  />
                </>
              ) : (
                <AgentPersonalityPanel
                  catalogFileInputRef={catalogFileInputRef}
                  onCatalogFileChange={handleCatalogFileChange}
                  catalogImportMode={catalogImportMode}
                  onCatalogImportMode={setCatalogImportMode}
                  catalogImporting={catalogImporting}
                  agentBusinessSummary={agentBusinessSummary}
                  onAgentBusinessSummary={setAgentBusinessSummary}
                  agentCatalog={agentCatalog}
                  onAgentCatalog={setAgentCatalog}
                  agentPricingRules={agentPricingRules}
                  onAgentPricingRules={setAgentPricingRules}
                  agentShippingZones={agentShippingZones}
                  onAgentShippingZones={setAgentShippingZones}
                  agentPaymentMethods={agentPaymentMethods}
                  onAgentPaymentMethods={setAgentPaymentMethods}
                  agentReturnsWarranty={agentReturnsWarranty}
                  onAgentReturnsWarranty={setAgentReturnsWarranty}
                  agentFaq={agentFaq}
                  onAgentFaq={setAgentFaq}
                  agentOffHoursMessage={agentOffHoursMessage}
                  onAgentOffHoursMessage={setAgentOffHoursMessage}
                  agentHardRules={agentHardRules}
                  onAgentHardRules={setAgentHardRules}
                  agentInstructions={agentInstructions}
                  onAgentInstructions={setAgentInstructions}
                  agentLeadCapture={agentLeadCapture}
                  onAgentLeadCapture={setAgentLeadCapture}
                />
              )}

              <ConfiguracionFormActions
                settingsTab={settingsTab}
                saving={saving}
                onReload={() => void load()}
                onClearSecrets={() => void onClearSecrets()}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
