import Link from "next/link";
import { notFound } from "next/navigation";

import { ConversationNotesPanel } from "@/components/ConversationNotesPanel";
import { HandoffButton } from "@/components/HandoffButton";
import { LeadQualificationChips } from "@/components/LeadQualificationChips";
import { fetchConversation } from "@/lib/server-api";
import { waAvatarGlyph, waAvatarHue, waChatTitle } from "@/lib/wa-display";

type Props = { params: Promise<{ id: string }> };

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;
  let data: Awaited<ReturnType<typeof fetchConversation>>;
  try {
    data = await fetchConversation(id);
  } catch {
    notFound();
  }

  const title = waChatTitle(data.twilio_from);
  const glyph = waAvatarGlyph(data.twilio_from);
  const hue = waAvatarHue(data.twilio_from);
  const llmBad = (data.last_agent_llm_status || "ok").toLowerCase() !== "ok";
  const showHandoffStrip = data.pending_handoff || data.status === "handed_off";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-gradient-to-b from-[#1e2a32] to-[var(--wa-panel)] px-3 py-2 shadow-lg sm:px-4">
        <Link
          href="/chats"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--wa-text-muted)] transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Lista de chats"
        >
          <span className="text-xl">‹</span>
        </Link>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg ring-2 ring-black/30 sm:h-11 sm:w-11"
          style={{
            background: `linear-gradient(145deg, hsl(${hue},58%,44%), hsl(${(hue + 42) % 360},52%,30%))`,
          }}
          aria-hidden
        >
          {glyph}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-display)] truncate text-base font-semibold text-white sm:text-[17px]">
            {title}
          </h1>
          <p className="truncate text-[11px] text-[var(--wa-text-muted)]">
            {data.status === "open" ? (
              <span className="text-[var(--wa-accent-soft)]">● </span>
            ) : null}
            {data.status}
            {llmBad ? (
              <span className="ml-2 rounded bg-red-500/20 px-1.5 py-px text-[10px] font-semibold uppercase text-red-200/95">
                LLM
              </span>
            ) : null}
          </p>
        </div>
        <HandoffButton conversationId={data.id} currentStatus={data.status} />
      </header>

      {(showHandoffStrip || data.lead) && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/[0.04] bg-black/30 px-2.5 py-1.5 sm:px-3">
          {showHandoffStrip ? (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-400/20 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-50/95"
              title={
                data.pending_handoff
                  ? `Motivo: ${data.pending_handoff.reason}`
                  : "Conversación marcada como handed_off"
              }
            >
              <span className="font-semibold text-amber-100/95">Escalado</span>
              {data.pending_handoff ? (
                <span className="max-w-[12rem] truncate text-amber-100/75">
                  · {data.pending_handoff.reason}
                </span>
              ) : null}
            </span>
          ) : null}

          {data.lead ? (
            <>
              {showHandoffStrip ? <span className="hidden h-3 w-px bg-white/10 sm:block" aria-hidden /> : null}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--wa-text-muted)]">
                Lead
              </span>
              <span className="max-w-[8rem] truncate text-[12px] font-medium text-[var(--wa-text)] sm:max-w-[10rem]">
                {data.lead.name ?? "Sin nombre"}
              </span>
              <span className="rounded bg-white/[0.08] px-1.5 py-px text-[10px] font-medium uppercase text-[var(--wa-text-muted)]">
                {data.lead.stage}
              </span>
              <div className="flex w-full min-w-0 basis-full flex-wrap items-center gap-1 sm:basis-auto sm:w-auto">
                <LeadQualificationChips q={data.lead.qualification} />
              </div>
            </>
          ) : null}

          {showHandoffStrip ? (
            <details className="ml-auto min-w-0 text-[11px]">
              <summary className="cursor-pointer list-none text-[var(--wa-link)] marker:content-none [&::-webkit-details-marker]:hidden hover:underline">
                ¿Qué implica el escalado?
              </summary>
              <p className="mt-1.5 max-w-md rounded-md border border-white/[0.06] bg-black/40 p-2 text-[11px] leading-relaxed text-[var(--wa-text-muted)]">
                El cliente sigue en WhatsApp con el último mensaje del flujo. Aquí ves{" "}
                <strong className="text-[var(--wa-text)]">handed_off</strong>
                {data.pending_handoff ? (
                  <>
                    {" "}
                    y una solicitud <strong className="text-[var(--wa-text)]">pendiente</strong>.
                  </>
                ) : (
                  "."
                )}{" "}
                Avisos automáticos (email, Slack) no están conectados todavía.
              </p>
            </details>
          ) : null}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="wa-chat-canvas wa-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 pb-4">
            {data.messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--wa-text-muted)]">Sin mensajes aún.</p>
            ) : (
              data.messages.map((m) => {
                const inbound = m.direction === "inbound";
                return (
                  <div
                    key={m.id}
                    className={`flex w-full ${inbound ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={[
                        "relative max-w-[min(88%,30rem)] rounded-2xl px-3.5 py-2.5 shadow-xl sm:px-4 sm:py-3",
                        inbound
                          ? "rounded-tl-md bg-[var(--wa-bubble-in)] text-[var(--wa-text)] ring-1 ring-white/[0.07]"
                          : "rounded-tr-md bg-gradient-to-br from-[#005c4b] to-[#004a3c] text-[var(--wa-text)] ring-1 ring-black/25",
                      ].join(" ")}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span
                          className={
                            inbound
                              ? "text-[10px] font-bold uppercase tracking-wider text-[var(--wa-accent-soft)]"
                              : "text-[10px] font-bold uppercase tracking-wider text-white/65"
                          }
                        >
                          {inbound ? "Cliente" : "Agente"}
                        </span>
                        <time
                          className={
                            inbound
                              ? "text-[10px] tabular-nums text-[var(--wa-text-muted)]"
                              : "text-[10px] tabular-nums text-white/55"
                          }
                          dateTime={m.created_at}
                        >
                          {new Date(m.created_at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed [word-break:break-word]">
                        {m.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            <div className="flex justify-end px-0.5 pt-1">
              {llmBad ? (
                <details className="max-w-[min(88%,30rem)] rounded-xl border border-red-500/30 bg-red-950/40 text-left text-[11px] text-red-50/95">
                  <summary className="cursor-pointer list-none px-2.5 py-1.5 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold">Error LLM</span>
                    <span className="ml-1 text-red-200/75">· tocar para detalle</span>
                  </summary>
                  <div className="border-t border-red-500/20 px-2.5 py-2 font-mono text-[10px] leading-snug text-red-100/85">
                    {data.last_agent_llm_error ?? data.last_agent_llm_status}
                  </div>
                </details>
              ) : (
                <p className="rounded-lg border border-emerald-500/15 bg-emerald-950/20 px-2 py-1 text-[10px] text-emerald-200/70">
                  LLM última respuesta: <span className="font-mono text-emerald-100/90">ok</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {data.lead ? (
          <details className="shrink-0 border-t border-white/[0.06] bg-black/25">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-left marker:content-none [&::-webkit-details-marker]:hidden sm:px-4">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[var(--wa-text)]">
                <span className="w-4 text-[var(--wa-text-muted)]">›</span>
                Ficha lead completa
              </span>
              <span className="text-[10px] text-[var(--wa-text-muted)]">Email, teléfono, CRM</span>
            </summary>
            <div className="border-t border-white/[0.04] px-3 pb-3 pt-2 sm:px-4">
              <dl className="mx-auto grid max-w-2xl grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-[10px] uppercase text-[var(--wa-text-muted)]">Nombre</dt>
                  <dd className="truncate font-medium text-[var(--wa-text)]">{data.lead.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-[var(--wa-text-muted)]">Email</dt>
                  <dd className="truncate text-[var(--wa-text)]">{data.lead.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-[var(--wa-text-muted)]">Teléfono</dt>
                  <dd className="truncate font-mono text-xs text-[var(--wa-text)]">{data.lead.phone}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-[var(--wa-text-muted)]">Etapa</dt>
                  <dd className="truncate text-[var(--wa-text)]">{data.lead.stage}</dd>
                </div>
              </dl>
              {data.lead.qualification && Object.keys(data.lead.qualification).length > 0 ? (
                <div className="mx-auto mt-3 max-w-2xl">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--wa-text-muted)]">
                    Calificación
                  </p>
                  <LeadQualificationChips q={data.lead.qualification} />
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        <ConversationNotesPanel
          conversationId={data.id}
          initialNotes={data.internal_notes}
          initialTags={data.internal_tags ?? []}
        />
      </div>
    </div>
  );
}
