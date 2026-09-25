import { useId } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Landing.module.css";

interface CanisterProps {
  /** ISO printed large on the label. */
  iso: number;
  /** Film family line above the ISO, e.g. "COLOR". */
  family: string;
  /** Line under the ISO, e.g. "36 KIỂU". */
  exposures: string;
  /** Accessible description of the canister. */
  label: string;
  width: number;
  className?: string;
}

/**
 * A generic 35mm canister in `stock-gold` (warm colour negative), drawn
 * rather than photographed: the design system never shows a manufacturer's
 * logo, box art or trade dress, so the canvas's product photo isn't used.
 */
export function Canister({ iso, family, exposures, label, width, className }: CanisterProps) {
  const shadeId = `${useId()}-shade`;
  return (
    <svg
      className={cx(styles.canister, className)}
      viewBox="0 0 110 200"
      width={width}
      height={(width * 200) / 110}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={shadeId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="0.28" stopColor="#fff" stopOpacity="0.24" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
      </defs>
      <rect className={styles.canFilm} x="40" y="0" width="30" height="14" rx="2" />
      <rect className={styles.canFilm} x="4" y="12" width="102" height="16" rx="4" />
      <rect className={styles.canBody} x="10" y="26" width="90" height="150" />
      <rect className={styles.canRib} x="10" y="26" width="90" height="5" />
      <rect className={styles.canRib} x="10" y="171" width="90" height="5" />
      <rect className={styles.canLabel} x="10" y="62" width="90" height="80" />
      <text className={styles.canSmall} x="55" y="82">{family}</text>
      <text className={styles.canBig} x="55" y="116">{iso}</text>
      <text className={styles.canSmall} x="55" y="132">{exposures}</text>
      <rect x="10" y="26" width="90" height="150" fill={`url(#${shadeId})`} />
      <rect className={styles.canFilm} x="1" y="36" width="11" height="130" rx="2" />
      <rect className={styles.canFilm} x="4" y="174" width="102" height="16" rx="4" />
    </svg>
  );
}
