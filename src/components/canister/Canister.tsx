import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import { canisterFill } from "@/features/canister/look";
import styles from "./Canister.module.css";

export interface CanisterProps {
  /** A preset slug (`gold` … `cream`), a stock family or `#rrggbb` (plan D1). Anything else, or `null`, draws gold: only `canisterFill`'s output reaches `style` (Review Focus 4). */
  color: string | null;
  /** `sm` only: printed on the label band. Omitted (no band text) when `null`/`undefined`. */
  iso?: number | null;
  /** `sm` (44×72: bag strip, roll page, custom-entry preview) or `shelf` (the `Shelf` board's canister, scaled by font-size). */
  size?: "sm" | "shelf";
  /** `shelf` only, CAN-2: the roll name, handwritten on the label band. */
  label?: string;
  /** `shelf` only, CAN-2: the film-type sticker, "C-41 · 200". */
  sticker?: string | null;
  /** `shelf` only, CAN-2: the stock's catalogue photo, shown instead of the drawing. */
  photoSrc?: string;
  className?: string;
}

/**
 * A 35mm canister, always decorative (`aria-hidden`): callers name it.
 *
 * `sm` is the design system's `.rc-can` (components/bundle.css), the same
 * shape `RollCard` draws, plus a 1px `line-strong` edge on the body.
 * `shelf` is the Phase 3 `Shelf` board's pure-CSS canister (metal nub and
 * caps, film bands, print label band, sticker, tapered leader with
 * sprocket holes), or the stock's catalogue photo when given one.
 */
export function Canister({ color, iso, size = "sm", label, sticker, photoSrc, className }: CanisterProps) {
  const style = { "--rc-stock": canisterFill(color) } as CSSProperties;

  if (size === "shelf") {
    return (
      <span className={cx(styles.shelf, className)} style={style} aria-hidden="true">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- catalogue photo from the public bucket (D18)
          <img className={styles.photo} src={photoSrc} alt="" loading="lazy" decoding="async" />
        ) : (
          <>
            <span className={styles.lead} />
            <span className={styles.nub} />
            <span className={cx(styles.shelfCap, styles.capTop)} />
            <span className={styles.shelfBody}>
              {label ? (
                <span className={styles.nameBand}>
                  <span>{label}</span>
                </span>
              ) : null}
              {sticker ? (
                <span className={styles.sticker}>
                  <span>{sticker}</span>
                </span>
              ) : null}
            </span>
            <span className={cx(styles.shelfCap, styles.capBottom)} />
          </>
        )}
      </span>
    );
  }

  return (
    <span className={cx(styles.canister, className)} style={style} aria-hidden="true">
      <span className={styles.cap} />
      <span className={styles.body}>{iso != null ? <span className={styles.label}>{iso}</span> : null}</span>
      <span className={styles.leader} />
    </span>
  );
}
