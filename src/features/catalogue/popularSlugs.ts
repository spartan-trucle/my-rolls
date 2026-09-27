/**
 * F1's curated chip lists (`OnboardBag` board): the cameras and film
 * stocks most Vietnamese film shooters reach for first, mapped to their
 * real slugs in `data/catalogue/{cameras,stocks}.json` (B3's seed). Order
 * here is the order the chips render in, matching the board.
 */
export const POPULAR_CAMERA_SLUGS = [
  "pentax-k1000",
  "nikon-fm2",
  "canon-ae-1",
  "olympus-mju-ii",
  "yashica-t4",
  "minolta-x-700",
  "canon-af35m-autoboy",
] as const;

export const POPULAR_STOCK_SLUGS = [
  "kodak-gold-200-200",
  "kodak-colorplus-200-200",
  "fujifilm-superia-x-tra-400-400",
  "kodak-portra-400-400",
  "ilford-hp5-plus-400",
  "kodak-tri-x-400-400",
  "kodak-vision3-500t-500",
  "kodak-ektar-100-100",
] as const;
