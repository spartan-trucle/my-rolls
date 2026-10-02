import type { CanisterProps } from "@/components/canister/Canister";
import type { IRollEntry } from "@/features/rolls/core";
import { isCanisterColor, resolveCanisterLook } from "./look";
import { filmSticker } from "./sticker";

/**
 * CAN-2: a roll's canister on the shelf. `fallbackName` is "Cuộn #N" from
 * the caller's translations. `color` is the raw value (slug or hex), not
 * a CSS fill: `Canister` runs it through `canisterFill` itself (Ruling R6).
 */
export function toCanisterProps(entry: IRollEntry, fallbackName: string): CanisterProps {
  const stockColor = entry.stock?.canisterColor ?? entry.canisterColor;
  const style = entry.canisterStyle ?? "stock";
  const look = resolveCanisterLook({
    style,
    rollColor: entry.canisterColor,
    stockColor,
    stockPhotoUrl: entry.stock?.canisterPhotoUrl ?? null,
  });
  const ownColor = entry.canisterColor !== null && isCanisterColor(entry.canisterColor) ? entry.canisterColor : null;

  return {
    size: "shelf",
    color: style === "drawn" ? (ownColor ?? stockColor) : stockColor,
    label: entry.name ?? fallbackName,
    sticker: filmSticker(entry.stock?.type ?? null, entry.boxIso ?? entry.stock?.iso ?? null),
    photoSrc: look.kind === "photo" ? look.src : undefined,
  };
}
