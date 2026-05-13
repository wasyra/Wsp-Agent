export const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--wa-border)] bg-[#2a3942] px-3 py-2.5 text-sm text-[var(--wa-text)] shadow-inner placeholder:text-[var(--wa-text-muted)] focus:border-[var(--wa-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--wa-accent)]";

export const textareaClass = `${inputClass} min-h-[120px] resize-y leading-relaxed`;

/** IDs válidos para la API Gemini (Developer); elige según cuotas en Google AI Studio. */
export const GEMINI_MODEL_PRESETS: { value: string; label: string }[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (recomendado, plan gratuito típico)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-flash-latest", label: "Gemini Flash (última versión estable)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (más capacidad, cuotas distintas)" },
];

export const GEMINI_MODEL_CUSTOM = "__custom__";

export function geminiModelSelectValue(model: string): string {
  return GEMINI_MODEL_PRESETS.some((p) => p.value === model) ? model : GEMINI_MODEL_CUSTOM;
}
