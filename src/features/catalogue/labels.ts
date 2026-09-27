/**
 * `stock.type` and `camera.type` (`src/db/schema/catalogue.ts`) are plain
 * text natural keys the seed (B3) and `CustomEntryForm`'s validation
 * (`type: z.string().trim().min(1).optional()`, `core.ts`) use — never
 * shown to users directly (CLAUDE.md: UI copy is Vietnamese). These maps
 * translate the known slugs into `catalogue.types` keys in `messages/vi.json`;
 * an unrecognised or missing slug renders nothing rather than the raw
 * value (`labels.test.ts` checks every seeded slug has a label).
 */

export type TStockTypeLabelKey =
  | "colorNegative"
  | "slide"
  | "bw"
  | "cine"
  | "specialEffect"
  | "instant";

export type TCameraTypeLabelKey =
  | "slr"
  | "rangefinder"
  | "pointAndShoot"
  | "halfFrame"
  | "tlr"
  | "mediumFormat"
  | "toy"
  | "singleUse";

const STOCK_TYPE_LABEL_KEYS: Record<string, TStockTypeLabelKey> = {
  "color-negative": "colorNegative",
  slide: "slide",
  bw: "bw",
  cine: "cine",
  "special-effect": "specialEffect",
  instant: "instant",
};

const CAMERA_TYPE_LABEL_KEYS: Record<string, TCameraTypeLabelKey> = {
  slr: "slr",
  rangefinder: "rangefinder",
  "point-and-shoot": "pointAndShoot",
  "half-frame": "halfFrame",
  tlr: "tlr",
  "medium-format": "mediumFormat",
  toy: "toy",
  "single-use": "singleUse",
};

/** `stock.type`'s natural-key slug (e.g. `"color-negative"`) → its `catalogue.types` message key, or `null` for a null/unknown value. */
export function stockTypeLabelKey(type: string | null | undefined): TStockTypeLabelKey | null {
  if (!type) return null;
  return STOCK_TYPE_LABEL_KEYS[type] ?? null;
}

/** `camera.type`'s natural-key slug (e.g. `"slr"`) → its `catalogue.types` message key, or `null` for a null/unknown value. */
export function cameraTypeLabelKey(type: string | null | undefined): TCameraTypeLabelKey | null {
  if (!type) return null;
  return CAMERA_TYPE_LABEL_KEYS[type] ?? null;
}
