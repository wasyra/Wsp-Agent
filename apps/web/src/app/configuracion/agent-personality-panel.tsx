import Link from "next/link";
import type { ChangeEvent, RefObject } from "react";

import { AgentConfigCard } from "./agent-config-card";
import { textareaClass } from "./configuracion-constants";
import { IconBot } from "./configuracion-icons";

export function AgentPersonalityPanel({
  catalogFileInputRef,
  onCatalogFileChange,
  catalogImportMode,
  onCatalogImportMode,
  catalogImporting,
  agentBusinessSummary,
  onAgentBusinessSummary,
  agentCatalog,
  onAgentCatalog,
  agentPricingRules,
  onAgentPricingRules,
  agentShippingZones,
  onAgentShippingZones,
  agentPaymentMethods,
  onAgentPaymentMethods,
  agentReturnsWarranty,
  onAgentReturnsWarranty,
  agentFaq,
  onAgentFaq,
  agentOffHoursMessage,
  onAgentOffHoursMessage,
  agentHardRules,
  onAgentHardRules,
  agentInstructions,
  onAgentInstructions,
  agentLeadCapture,
  onAgentLeadCapture,
}: {
  catalogFileInputRef: RefObject<HTMLInputElement | null>;
  onCatalogFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  catalogImportMode: "append" | "replace";
  onCatalogImportMode: (m: "append" | "replace") => void;
  catalogImporting: boolean;
  agentBusinessSummary: string;
  onAgentBusinessSummary: (v: string) => void;
  agentCatalog: string;
  onAgentCatalog: (v: string) => void;
  agentPricingRules: string;
  onAgentPricingRules: (v: string) => void;
  agentShippingZones: string;
  onAgentShippingZones: (v: string) => void;
  agentPaymentMethods: string;
  onAgentPaymentMethods: (v: string) => void;
  agentReturnsWarranty: string;
  onAgentReturnsWarranty: (v: string) => void;
  agentFaq: string;
  onAgentFaq: (v: string) => void;
  agentOffHoursMessage: string;
  onAgentOffHoursMessage: (v: string) => void;
  agentHardRules: string;
  onAgentHardRules: (v: string) => void;
  agentInstructions: string;
  onAgentInstructions: (v: string) => void;
  agentLeadCapture: string;
  onAgentLeadCapture: (v: string) => void;
}) {
  return (
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
        <strong className="text-[var(--wa-text)]">peruano</strong> (soles, distritos, RUC/boleta cuando lo indiques).
        Los registros aparecen en{" "}
        <Link href="/leads" className="font-medium text-[var(--wa-link)] underline">
          Leads
        </Link>{" "}
        cuando el modelo ejecuta{" "}
        <code className="rounded bg-black/35 px-1 text-[var(--wa-text)]">save_lead</code>. Cada bloque siguiente se
        inyecta en el <strong className="text-[var(--wa-text)]">orden mostrado</strong> en el prompt del sistema: sé
        específico; el modelo tratará el catálogo como fuente de verdad para nombres y precios.
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
            Escribe al número de WhatsApp del negocio algo como: «Hola, soy Ana de Surco, busco jarras para regalo, mi
            correo es…».
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
          Si la lista sigue vacía, el modelo no llamó <code className="rounded bg-black/35 px-1">save_lead</code>:
          revisa el LLM y refuerza en «CRM / Leads».
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
            onChange={(e) => onAgentBusinessSummary(e.target.value)}
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
            onChange={onCatalogFileChange}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex rounded-lg border border-[var(--wa-border)] bg-black/30 p-0.5">
              <button
                type="button"
                onClick={() => onCatalogImportMode("append")}
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
                onClick={() => onCatalogImportMode("replace")}
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
              «Reemplazar» borra el texto actual del catálogo y deja solo lo importado (más la línea # Import).
            </span>
          </div>
          <textarea
            className={`${textareaClass} mt-3 min-h-[200px]`}
            value={agentCatalog}
            onChange={(e) => onAgentCatalog(e.target.value)}
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
            onChange={(e) => onAgentPricingRules(e.target.value)}
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
            onChange={(e) => onAgentShippingZones(e.target.value)}
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
            onChange={(e) => onAgentPaymentMethods(e.target.value)}
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
            onChange={(e) => onAgentReturnsWarranty(e.target.value)}
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
            onChange={(e) => onAgentFaq(e.target.value)}
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
            onChange={(e) => onAgentOffHoursMessage(e.target.value)}
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
            onChange={(e) => onAgentHardRules(e.target.value)}
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
            onChange={(e) => onAgentInstructions(e.target.value)}
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
            onChange={(e) => onAgentLeadCapture(e.target.value)}
            placeholder="Ej.: Siempre pedir distrito y correo para cotización; tras nombre + interés llamar save_lead; actualizar si cambian cantidad o producto."
            rows={5}
            spellCheck
          />
          <p className="mt-2 text-xs text-[var(--wa-text-muted)]">
            Cada llamada a <code className="rounded bg-black/35 px-1">save_lead</code> fusiona con el lead del mismo
            chat.
          </p>
        </AgentConfigCard>
      </div>
    </section>
  );
}
