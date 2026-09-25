import Image from "next/image";
import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Landing.module.css";

export type TStickerName = "bang" | "bolt" | "butterfly" | "heart" | "reel" | "smile" | "sparkle";

interface StickerProps {
  name: TStickerName;
  /** px, 56–120 on desktop (design system: Iconography). */
  size: number;
  /** Degrees; stickers tilt up to ±15° (the hero goes a little wilder, as on the canvas). */
  tilt?: number;
  /** Staggers the bob so neighbours don't move together. */
  delay?: number;
  /** Positions the sticker; set in the section's CSS module. */
  className?: string;
}

/**
 * A die-cut cobalt sticker from the design system (`assets/Stickers`),
 * copied into `public/landing/stickers/`. Pure decoration: `alt=""`, no
 * pointer events, and never over a face or text.
 */
export function Sticker({ name, size, tilt = 0, delay = 0, className }: StickerProps) {
  const style = { "--r": `${tilt}deg`, "--dd": `${delay}s` } as CSSProperties;
  return (
    <Image
      src={`/landing/stickers/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className={cx(styles.sticker, className)}
      style={style}
    />
  );
}
