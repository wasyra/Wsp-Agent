export default function ChatsIndexPage() {
  return (
    <div className="wa-chat-canvas flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative">
        <div className="absolute -inset-16 rounded-full bg-gradient-to-tr from-[var(--wa-accent)]/25 via-transparent to-[#53bdeb]/15 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[var(--wa-panel)] to-[#0f1720] p-1 shadow-2xl ring-1 ring-white/[0.08]">
          <div className="flex h-full w-full items-center justify-center rounded-[1.75rem] bg-[var(--wa-bg)]/80 text-4xl">
            💬
          </div>
        </div>
      </div>
      <h1 className="font-[family-name:var(--font-display)] mt-10 max-w-sm text-xl font-semibold tracking-tight text-white sm:text-2xl">
        Tus conversaciones en un solo lugar
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--wa-text-muted)]">
        Elige un chat en la lista para leer el hilo, ver el lead y escalar a un humano cuando haga
        falta.
      </p>
      <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--wa-text-muted)]">
        Twilio · WhatsApp · Agent
      </p>
    </div>
  );
}
