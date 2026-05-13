"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const POLL_MS = 16_000;

type Payload = {
  updated_at: string;
  messages: { id: string }[];
};

/**
 * Refresca el layout del chat (SSR) cuando hay mensajes nuevos o cambió `updated_at`.
 */
export function ChatDetailRefresh({
  conversationId,
  initialUpdatedAt,
  initialLastMessageId,
}: {
  conversationId: string;
  initialUpdatedAt: string;
  initialLastMessageId: string;
}) {
  const router = useRouter();
  const baseline = useRef({ updatedAt: initialUpdatedAt, lastId: initialLastMessageId });

  useEffect(() => {
    baseline.current = { updatedAt: initialUpdatedAt, lastId: initialLastMessageId };
  }, [initialUpdatedAt, initialLastMessageId]);

  const check = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch(`/api/internal/conversations/${conversationId}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as Payload;
      const last = j.messages?.length ? j.messages[j.messages.length - 1]!.id : "";
      const b = baseline.current;
      if (j.updated_at !== b.updatedAt || last !== b.lastId) {
        baseline.current = { updatedAt: j.updated_at, lastId: last };
        router.refresh();
      }
    } catch {
      /* silencioso en polling */
    }
  }, [conversationId, router]);

  useEffect(() => {
    const id = setInterval(() => void check(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check]);

  return null;
}
