function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Profile's mono "Vào Cuộn từ dd.mm.yy" line (the boards' own format —
 * matches `AuthLayout`'s `photoOneDate` and the landing page's ticket
 * dates). Uses the local calendar day, same as every other date already
 * hand-set in this codebase's copy.
 */
export function formatJoinedDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = pad2(d.getFullYear() % 100);
  return `${day}.${month}.${year}`;
}
