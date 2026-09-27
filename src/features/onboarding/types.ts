/**
 * The slice of `TCatalogueEntry` (`features/catalogue/queries.ts`) F1's
 * chips actually render — brand/name/model and, for a stock, the
 * canister colour for its swatch. Shared between the curated popular
 * list, search results and a freshly created custom entry, so
 * `OnboardBagContent` renders all three the same way.
 */
export interface ICameraChip {
  kind: "camera";
  id: string;
  brand: string;
  model: string;
}

export interface IStockChip {
  kind: "stock";
  id: string;
  brand: string;
  name: string;
  canisterColor: string | null;
}

export type TChip = ICameraChip | IStockChip;

export function chipKey(kind: TChip["kind"], id: string): string {
  return `${kind}:${id}`;
}

export function chipLabel(chip: TChip): string {
  return chip.kind === "stock" ? `${chip.brand} ${chip.name}` : `${chip.brand} ${chip.model}`;
}
