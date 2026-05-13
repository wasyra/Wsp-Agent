export function ConfiguracionFlash({
  message,
}: {
  message: { type: "ok" | "err"; text: string } | null;
}) {
  if (!message) return null;
  return (
    <div
      className={
        message.type === "ok"
          ? "mt-4 rounded-xl border border-[var(--wa-accent)]/40 bg-[var(--wa-bubble-out)]/30 px-4 py-3 text-sm text-[var(--wa-text)]"
          : "mt-4 rounded-xl border border-[var(--wa-danger)]/50 bg-red-950/40 px-4 py-3 text-sm text-red-100"
      }
    >
      {message.text}
    </div>
  );
}
