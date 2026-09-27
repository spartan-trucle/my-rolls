import type { RollCardProps, Stock } from "@/design-system";
import type { IRollEntry } from "./core";
import { formatRollDate } from "./format-date";

const STOCK_FAMILIES: ReadonlySet<string> = new Set<Stock>(["gold", "green", "blue", "mono", "rose"]);

/** `IRollEntry.canisterColor` is free text (D9: no DB enum); only a known family becomes a `Stock`, so `RollCard` falls back to its own default otherwise. */
function toStockFamily(canisterColor: string | null): Stock | undefined {
  return canisterColor !== null && STOCK_FAMILIES.has(canisterColor) ? (canisterColor as Stock) : undefined;
}

export interface IToRollCardPropsOptions {
  /**
   * N1/H: the `home.unnamedRoll` string ("Cuộn #{number}"), already
   * formatted by the caller with `entry.number` — kept out of this pure
   * function so it stays free of next-intl (D15's `getRoll`/`listRolls`
   * callers run both on the server and in tests). `undefined` when
   * `entry.number` isn't set (a pre-Round-2 row), falling back to the
   * stock name below, same as before N1.
   */
  unnamedRollLabel?: string;
}

/**
 * D15/N1: maps a `listRolls()` entry to the Home board's `RollCard` props.
 * An unnamed roll reads as "Cuộn #{number}" (the boards' kicker/heading,
 * settling audit N1's conflict with the earlier "the stock's name"
 * reading), falling back to "{brand} {stock name}" (e.g. "Kodak Gold 200")
 * only when there's no roll number to build that label from.
 *
 * The design system's `RollCard` (docs/design/design-system.md) has no
 * push/pull slot of its own, so the badge rides along in `date` — its
 * `cameraLine` already joins `camera` and `date` with " · ", giving
 * "Pentax K1000 · 12.10.25 · +1" without a new prop needing a design-system
 * sync. Left out entirely at "0": no push or pull is nothing to flag.
 */
export function toRollCardProps(entry: IRollEntry, options: IToRollCardPropsOptions = {}): RollCardProps {
  const stockLabel = entry.stock ? `${entry.stock.brand} ${entry.stock.name}` : undefined;
  const cameraLabel = entry.camera ? `${entry.camera.brand} ${entry.camera.model}` : undefined;
  const dateLabel = formatRollDate(entry.shotFrom, entry.datePrecision);
  const showPushPull = entry.pushPull !== null && entry.pushPull !== "0";
  const date = showPushPull ? [dateLabel, entry.pushPull].filter(Boolean).join(" · ") : (dateLabel ?? undefined);

  return {
    href: `/rolls/${entry.id}`,
    name: entry.name ?? options.unnamedRollLabel ?? stockLabel ?? entry.id,
    stock: toStockFamily(entry.canisterColor),
    iso: entry.boxIso ?? entry.stock?.iso ?? undefined,
    film: stockLabel,
    exposures: entry.exposures ?? undefined,
    camera: cameraLabel,
    date,
  };
}
