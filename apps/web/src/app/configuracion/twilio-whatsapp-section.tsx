import { inputClass } from "./configuracion-constants";
import type { Settings } from "./configuracion-types";

export function TwilioWhatsappSection({
  twilioAccountSid,
  onTwilioAccountSid,
  twilioToken,
  onTwilioToken,
  data,
}: {
  twilioAccountSid: string;
  onTwilioAccountSid: (v: string) => void;
  twilioToken: string;
  onTwilioToken: (v: string) => void;
  data: Settings | null;
}) {
  return (
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
        entra a <strong>Messaging → Try it out → WhatsApp sandbox</strong> (o tu canal WhatsApp). Ahí verás el{" "}
        <strong>Account SID</strong> y podrás generar o copiar el <strong>Auth Token</strong>.
      </p>
      <div className="mt-4">
        <label className="block text-sm font-medium text-[var(--wa-text-muted)]">Account SID</label>
        <input
          className={inputClass}
          value={twilioAccountSid}
          onChange={(e) => onTwilioAccountSid(e.target.value)}
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
          onChange={(e) => onTwilioToken(e.target.value)}
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
  );
}
