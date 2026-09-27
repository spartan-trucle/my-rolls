import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Canister.module.css";

export interface CanisterProps {
  /** `stock.canister_color` (`gold` \| `green` \| `blue` \| `mono` \| `rose`). Falls back to `gold` when `null`, same as the bag/catalogue swatches this replaces. */
  color: string | null;
  /** Printed on the label band. Omitted (no band text) when `null`/`undefined`. */
  iso?: number | null;
  /** `sm` (~44px tall, the Bag board's pocket strip) or `md` (~70px, for a standalone canister e.g. the roll page, W2). Defaults to `sm`. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * A drawn 35mm canister (Bag board `.can`), coloured by `stock.canister_color`
 * and labelled with its box ISO — reusable so BAG-2's pocket strip (R2-3)
 * and, later, the roll page's canister (R6/CAN-2, W2) draw the same shape.
 * Plain SVG/CSS mapped to tokens (`--stock-*`, `--film`), no bitmap asset.
 */
export function Canister({ color, iso, size = "sm", className }: CanisterProps) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;

  return (
    <span
      className={cx(styles.canister, size === "md" && styles.md, className)}
      style={style}
      aria-hidden="true"
    >
      <span className={styles.cap} />
      <span className={styles.body}>{iso != null ? <span className={styles.label}>{iso}</span> : null}</span>
    </span>
  );
}
