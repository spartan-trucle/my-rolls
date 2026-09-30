const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: VN_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TIME_ZONE,
  month: "2-digit",
  year: "numeric",
});

/**
 * `dd.mm.yy` in `Asia/Ho_Chi_Minh`, matching D15's `RollCard`/roll-page date
 * (the `Home` board's cards read e.g. "12.10.25"). `en-GB` gives `dd/mm/yy`;
 * the slashes are swapped for dots to match the board exactly.
 *
 * R2-4 / audit P4: `precision` picks the format — `"month"` reads
 * `mm.yyyy` (e.g. "10.2025", `PastRoll`'s card date) instead of the day
 * form. Defaults to the day form (`"day"` or omitted); `IRollEntry`'s
 * `datePrecision` is only ever `"month"` for a roll actually saved with
 * month precision, so a `null` precision alongside a real `date` (which
 * shouldn't happen in practice) falls back to the day form too.
 *
 * `null` in, `null` out: `IRollEntry.shotFrom` is nullable ("Không nhớ",
 * R2-4, or a `new`-mode roll with no dates saved at all).
 */
export function formatRollDate(date: Date | null, precision: "day" | "month" | null = "day"): string | null {
  if (date === null) return null;
  if (precision === "month") {
    // `en-CA`'s `yyyy-mm` (no day field requested) reordered and swapped
    // to dots to match the board's "10.2025".
    const [year, month] = monthFormatter.format(date).split("-");
    return `${month}.${year}`;
  }
  return dayFormatter.format(date).replaceAll("/", ".");
}
