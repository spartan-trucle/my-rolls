import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Canister.module.css";

export interface CanisterProps {
  /** `stock.canister_color` (`gold` \| `green` \| `blue` \| `mono` \| `rose`). Falls back to `gold` when `null`, same as the bag/catalogue swatches this replaces. */
  color: string | null;
  /** Printed on the label band. Omitted (no band text) when `null`/`undefined`. */
  iso?: number | null;
  className?: string;
}

/**
 * A drawn 35mm canister — the design system's `.rc-can` (components/
 * bundle.css), the same shape `RollCard` draws: 44×72, film-coloured cap,
 * bands and leader, a print label band with the box ISO. Coloured by
 * `stock.canister_color`. Used by BAG-2's pocket strip (R2-3), the roll
 * page and the custom-entry preview.
 */
export function Canister({ color, iso, className }: CanisterProps) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;

  return (
    <span className={cx(styles.canister, className)} style={style} aria-hidden="true">
      <span className={styles.cap} />
      <span className={styles.body}>{iso != null ? <span className={styles.label}>{iso}</span> : null}</span>
      <span className={styles.leader} />
    </span>
  );
}
