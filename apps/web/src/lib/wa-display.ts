/** Etiqueta corta para avatar (último dígito o letra). */
export function waAvatarGlyph(from: string): string {
  const digits = from.replace(/\D/g, "");
  if (digits) return digits.slice(-1);
  const alnum = from.replace(/[^a-zA-Z0-9]/g, "");
  return alnum.slice(-1).toUpperCase() || "?";
}

/** Color de avatar estable a partir del identificador. */
export function waAvatarHue(from: string): number {
  let h = 0;
  for (let i = 0; i < from.length; i += 1) {
    h = (h + from.charCodeAt(i) * 13) % 360;
  }
  return h;
}

/** Título legible: quita prefijo whatsapp: y acorta. */
export function waChatTitle(from: string): string {
  const s = from.replace(/^whatsapp:/i, "").trim();
  return s || from;
}
