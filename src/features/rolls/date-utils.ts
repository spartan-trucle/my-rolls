const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * `YYYY-MM-DD` in `Asia/Ho_Chi_Minh`, so two epoch timestamps can be
 * compared by calendar day there, not the server's (or the browser's) own
 * time zone. No `"server-only"` here (unlike `core.ts`) because D3's
 * `RollForm` needs the same calendar-day logic client-side, to block a
 * future date before the Server Action round trip.
 */
export function toVnDateString(epochMs: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VN_TIME_ZONE }).format(new Date(epochMs));
}

/** Whether `epochMs` falls on a later calendar day, in `Asia/Ho_Chi_Minh`, than `nowMs` (D14). */
export function isFutureVnDay(epochMs: number, nowMs: number): boolean {
  return toVnDateString(epochMs) > toVnDateString(nowMs);
}

// Vietnam has been a fixed UTC+7 offset since 1975, no DST — so "local
// midnight in Asia/Ho_Chi_Minh" can be built with plain UTC arithmetic
// instead of going through `Intl` (which only formats, it can't construct
// a `Date` from a wall-clock time in an arbitrary zone).
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * R2-4 (past-mode month precision): the first day of `month`/`year`,
 * 00:00:00.000 in `Asia/Ho_Chi_Minh`, as the UTC instant that represents.
 * `month` is 1–12.
 */
export function vnMonthStart(month: number, year: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - VN_OFFSET_MS);
}

/**
 * R2-4: the last day of `month`/`year`, 23:59:59.999 in
 * `Asia/Ho_Chi_Minh`. `Date.UTC(year, month, 0, ...)` is JS's own "day 0
 * of next month" idiom for "last day of this month" — it already accounts
 * for 30- vs 31-day months and leap-year Februaries.
 */
export function vnMonthEnd(month: number, year: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999) - VN_OFFSET_MS);
}

/**
 * R2-4: whether `month`/`year` is later than the current Vietnam-time
 * month — "no future months" validation for past-mode dates, the
 * month-precision sibling of `isFutureVnDay`.
 */
export function isFutureVnMonth(month: number, year: number, nowMs: number): boolean {
  const [nowYear, nowMonth] = toVnDateString(nowMs).split("-").map(Number);
  return year > nowYear || (year === nowYear && month > nowMonth);
}
