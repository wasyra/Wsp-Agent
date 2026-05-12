/**
 * Server-only env.
 * Si no hay INTERNAL_API_KEY pero el backend es local, usamos `dev-internal-key`
 * (igual que el default de FastAPI) — sirve para `next dev` y `next start` en local.
 */
export function getBackendUrl(): string {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
}

function isLocalBackend(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

export function getInternalApiKey(): string {
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (key) {
    return key;
  }
  if (process.env.NODE_ENV === "development" || isLocalBackend(getBackendUrl())) {
    return "dev-internal-key";
  }
  throw new Error(
    "INTERNAL_API_KEY is not set. Add it to apps/web/.env.local (see apps/web/.env.example).",
  );
}
