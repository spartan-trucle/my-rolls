// True minus sign (U+2212, not a hyphen) and vulgar fraction glyphs (D17):
// the badge reads "−⅓", "+1⅓", never "-1/3".
const MINUS_SIGN = "−";
const THIRD = "⅓";
const TWO_THIRDS = "⅔";

/**
 * ROLL-1: push/pull "calculated in stops from box and shot-at ISO"
 * (D17), rounded to the nearest third of a stop — a stop is
 * `log2(shotIso / boxIso)`; standard push/pull practice (and most light
 * meters) work in thirds, not whole stops.
 *
 * `null` whenever either ISO is missing or not a positive number: there's
 * nothing to compute without both, and a zero/negative ISO can't exist on
 * real film.
 */
export function pushPullStops(boxIso: number | null, shotIso: number | null): number | null {
  if (boxIso === null || shotIso === null) return null;
  if (!(boxIso > 0) || !(shotIso > 0)) return null;

  const rawStops = Math.log2(shotIso / boxIso);
  const thirds = Math.round(rawStops * 3);

  return thirds / 3;
}

/**
 * Formats the stops `pushPullStops()` returns as ROLL-1's badge: `"+1"`,
 * `"−⅓"`, `"+1⅓"`, or `"0"` (no sign) when there's no push or pull.
 * `null` in, `null` out — the caller (D15's `RollCard`/roll page) skips
 * the badge entirely rather than showing an empty one.
 */
export function formatPushPull(stops: number | null): string | null {
  if (stops === null) return null;

  const thirds = Math.round(stops * 3);
  if (thirds === 0) return "0";

  const sign = thirds < 0 ? MINUS_SIGN : "+";
  const absThirds = Math.abs(thirds);
  const whole = Math.floor(absThirds / 3);
  const remainder = absThirds % 3;

  const wholeStr = whole > 0 ? String(whole) : "";
  const fracStr = remainder === 1 ? THIRD : remainder === 2 ? TWO_THIRDS : "";

  return `${sign}${wholeStr}${fracStr}`;
}
