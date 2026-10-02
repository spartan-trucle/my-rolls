/** CAN-2, plan D1–D2. No server imports: the shelf, the editor and the server action all use it. */
export const CANISTER_PRESETS = ["gold", "green", "blue", "rose", "red", "orange", "mono", "cream"] as const;
export type TCanisterPreset = (typeof CANISTER_PRESETS)[number];

export const CANISTER_STYLES = ["stock", "drawn", "photo"] as const;
export type TCanisterStyle = (typeof CANISTER_STYLES)[number];

const HEX = /^#[0-9a-f]{6}$/;

/** Only these two shapes ever reach a `style` attribute (Review Focus 4). */
export function isCanisterColor(value: string): boolean {
  return (CANISTER_PRESETS as readonly string[]).includes(value) || HEX.test(value);
}

export function canisterFill(color: string | null): string {
  if (color === null || !isCanisterColor(color)) return "var(--stock-gold)";
  return color.startsWith("#") ? color : `var(--stock-${color})`;
}

export type TCanisterLook = { kind: "drawn"; fill: string } | { kind: "photo"; src: string; fill: string };

export function resolveCanisterLook(input: {
  style: TCanisterStyle;
  rollColor: string | null;
  stockColor: string | null;
  stockPhotoUrl: string | null;
}): TCanisterLook {
  const stockFill = canisterFill(input.stockColor);
  if (input.style === "drawn") return { kind: "drawn", fill: canisterFill(input.rollColor) };
  if (input.style === "photo" && input.stockPhotoUrl) return { kind: "photo", src: input.stockPhotoUrl, fill: stockFill };
  return { kind: "drawn", fill: stockFill };
}
