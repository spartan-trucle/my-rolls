import { formatPushPull } from "@/features/rolls/push-pull";

/**
 * "+1", "−⅓", "-1/3", "+1⅔", "2" → thirds of a stop (D8). `null` for an empty field,
 * `undefined` for text it can't read (the form shows an error instead of guessing).
 */
export function parsePushPullThirds(input: string): number | null | undefined {
  const s = input.trim().replace(/\u2212/g, "-").replace(/\s+/g, "").replace("⅓", " 1/3").replace("⅔", " 2/3");
  if (s === "") return null;
  // [sign][whole][ ][1|2]/3, e.g. "+1", "-2/3", "+1 1/3", "2".
  const m = /^([+-]?)(\d+)?(?: ?([12])\/3)?$/.exec(s);
  if (!m || (!m[2] && !m[3])) return undefined;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2] ?? 0) * 3 + Number(m[3] ?? 0));
}

export function thirdsToLabel(thirds: number | null): string {
  return thirds === null ? "" : (formatPushPull(thirds / 3) ?? "");
}

/** "90.000" or "90000" → 90000; `null` when empty, `undefined` when not a number. */
export function parsePriceVnd(input: string): number | null | undefined {
  const s = input.trim().replace(/[.\s₫]/g, "");
  if (s === "") return null;
  return /^\d+$/.test(s) ? Number(s) : undefined;
}

/**
 * The board's scan-size chips. `resolution_px` stores a long edge, so each chip stands for a
 * common lab size (Noritsu base 3024, large 4492; Frontier/Noritsu extra large 6774).
 */
export const RESOLUTION_CHOICES = [
  { key: "normal", px: 3024 },
  { key: "large", px: 4492 },
  { key: "xlarge", px: 6774 },
] as const;
export type TResolutionChoice = (typeof RESOLUTION_CHOICES)[number]["key"];

export function resolutionChoiceFor(px: number | null): TResolutionChoice | null {
  if (px === null) return null;
  return RESOLUTION_CHOICES.reduce((best, c) => (Math.abs(c.px - px) < Math.abs(best.px - px) ? c : best)).key;
}

/** yyyy-mm-dd of `date` in Vietnam time, for `<input type="date">`. */
export function toDateInput(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** A `<input type="date">` value as midnight in Vietnam time. */
export function fromDateInput(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : null;
}
