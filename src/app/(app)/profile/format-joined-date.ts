const FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

/**
 * Profile's mono "Vào Cuộn từ dd.mm.yy" line (the boards' own format —
 * matches `AuthLayout`'s `photoOneDate` and the landing page's ticket
 * dates). Fixed to `Asia/Ho_Chi_Minh` (UTC+7), not the server's local
 * time: Vercel runs in UTC, so a user who signed up 00:00–06:59 Vietnam
 * time would otherwise see the previous day.
 */
export function formatJoinedDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = FORMATTER.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}
