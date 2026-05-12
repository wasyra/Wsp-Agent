import { Suspense } from "react";

import { ChatShell } from "@/components/ChatShell";
import { fetchConversations } from "@/lib/server-api";

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  let initialRows: Awaited<ReturnType<typeof fetchConversations>> = [];
  try {
    initialRows = await fetchConversations({ limit: 100 });
  } catch {
    initialRows = [];
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-52px)] items-center justify-center bg-[var(--wa-bg)] text-sm text-[var(--wa-text-muted)]">
          Cargando panel…
        </div>
      }
    >
      <ChatShell initialRows={initialRows}>{children}</ChatShell>
    </Suspense>
  );
}
