const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

/**
 * `dd.mm.yy` in `Asia/Ho_Chi_Minh`, matching D15's `RollCard`/roll-page date
 * (the `Home` board's cards read e.g. "12.10.25"). `en-GB` gives `dd/mm/yy`;
 * the slashes are swapped for dots to match the board exactly.
 *
 * `null` in, `null` out: `IRollEntry.shotFrom` is nullable in principle,
 * even though `createRoll` always fills it today.
 */
export function formatRollDate(date: Date | null): string | null {
  if (date === null) return null;
  return formatter.format(date).replaceAll("/", ".");
}
