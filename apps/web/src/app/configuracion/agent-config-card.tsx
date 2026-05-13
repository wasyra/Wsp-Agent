import type { ReactNode } from "react";

export function AgentConfigCard({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint: string;
  children: ReactNode;
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
