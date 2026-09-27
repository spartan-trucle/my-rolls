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
