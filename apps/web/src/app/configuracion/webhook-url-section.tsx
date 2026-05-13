import { inputClass } from "./configuracion-constants";
import type { Settings } from "./configuracion-types";

export function WebhookUrlSection({
  webhookBaseUrl,
  onWebhookBaseUrl,
  validateSignature,
  onValidateSignature,
  data,
}: {
  webhookBaseUrl: string;
  onWebhookBaseUrl: (v: string) => void;
  validateSignature: boolean;
  onValidateSignature: (v: boolean) => void;
  data: Settings | null;
}) {
  return (
    <section className="rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-panel)] p-6 shadow-xl sm:p-7">
      <h2 className="text-lg font-semibold text-[var(--wa-text)]">URL pública del webhook</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--wa-text-muted)]">
        Twilio debe poder llamar por HTTPS a tu API. Suele ser la URL de <strong>ngrok</strong>,{" "}
        <strong>Cloudflare Tunnel</strong>, etc., <strong>sin</strong> el path final (solo el origen, por ejemplo{" "}
        <code className="rounded bg-black/35 px-1.5 py-0.5 text-[var(--wa-text)]">https://abc123.ngrok-free.app</code>
        ).
      </p>
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--wa-text-muted)]">Webhook base URL</label>
        <input
          className={inputClass}
          value={webhookBaseUrl}
          onChange={(e) => onWebhookBaseUrl(e.target.value)}
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
          onChange={(e) => onValidateSignature(e.target.checked)}
          className="rounded border-[var(--wa-border)] bg-[#2a3942] text-[var(--wa-accent)] focus:ring-[var(--wa-accent)]"
        />
        Validar firma de Twilio (X-Twilio-Signature) — desactiva solo para pruebas rápidas en local.
      </label>
    </section>
  );
}
