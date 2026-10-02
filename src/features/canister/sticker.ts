/** CAN-2's film-type sticker, plan D4: "C-41 · 200". */
const PROCESS: Record<string, string> = {
  "color-negative": "C-41",
  slide: "E-6",
  bw: "B&W",
  cine: "ECN-2",
  instant: "INSTANT",
};

export function filmSticker(type: string | null, iso: number | null): string | null {
  const parts = [type ? PROCESS[type] : undefined, iso != null ? String(iso) : undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
