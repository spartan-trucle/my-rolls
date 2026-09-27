import type { RollCardProps, Stock } from "@/design-system";
import type { IRollEntry } from "./core";
import { formatRollDate } from "./format-date";

const STOCK_FAMILIES: ReadonlySet<string> = new Set<Stock>(["gold", "green", "blue", "mono", "rose"]);

/** `IRollEntry.canisterColor` is free text (D9: no DB enum); only a known family becomes a `Stock`, so `RollCard` falls back to its own default otherwise. */
function toStockFamily(canisterColor: string | null): Stock | undefined {
  return canisterColor !== null && STOCK_FAMILIES.has(canisterColor) ? (canisterColor as Stock) : undefined;
}

/**
 * D15: maps a `listRolls()` entry to the Home board's `RollCard` props.
 * `name` falls back to "{brand} {stock name}" (e.g. "Kodak Gold 200") when
 * the roll itself has no name, matching ROLL-1's "the stock's name" and
 * `RollCard.film`'s own "never a logo" rule.
 */
export function toRollCardProps(entry: IRollEntry): RollCardProps {
  const stockLabel = entry.stock ? `${entry.stock.brand} ${entry.stock.name}` : undefined;
  const cameraLabel = entry.camera ? `${entry.camera.brand} ${entry.camera.model}` : undefined;

  return {
    href: `/rolls/${entry.id}`,
    name: entry.name ?? stockLabel ?? entry.id,
    stock: toStockFamily(entry.canisterColor),
    iso: entry.boxIso ?? entry.stock?.iso ?? undefined,
    film: stockLabel,
    exposures: entry.exposures ?? undefined,
    camera: cameraLabel,
    date: formatRollDate(entry.shotFrom) ?? undefined,
  };
}
