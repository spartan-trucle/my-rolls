const VN = "Asia/Ho_Chi_Minh";

/** "14:02" in Vietnam time, for "Đã lưu 14:02". */
export function formatSavedTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", { timeZone: VN, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

/** "12.10" in Vietnam time, for a note's date. */
export function formatNoteDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: VN, day: "2-digit", month: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}`;
}
