import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { TILT, type Tilt } from "../tilt";
import styles from "./Print.module.css";

export interface PrintProps {
  src: string;
  /** Describes the photo ("Đồi thông lúc bình minh"). */
  alt: string;
  /** Handwritten, 2 to 6 lowercase words. */
  caption?: ReactNode;
  /** dd.mm.yy */
  date?: string;
  /** px or any CSS width. Use "100%" in grids. */
  width?: number | string;
  aspect?: `${number}/${number}`;
  format?: "classic" | "instant" | "borderless";
  attach?: "tape" | "tape-corner" | "pin";
  /** Grids and phones: "none". At most three tilted prints per screen. */
  tilt?: Tilt;
  /** Writes the caption in red pen. */
  oops?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Print({
  src, alt, caption, date, width = 240, aspect = "3/2", format = "classic",
  attach, tilt = "none", oops, className, style, children,
}: PrintProps) {
  const figureStyle = { ...style, width, "--rc-tilt": TILT[tilt] } as CSSProperties;
  const showFoot = format !== "borderless" && (caption || date || format === "instant");

  return (
    <figure className={cx(styles.print, styles[format], className)} style={figureStyle}>
      {attach === "tape" ? <span className={styles.tape} aria-hidden="true" /> : null}
      {attach === "tape-corner" ? <span className={cx(styles.tape, styles.tapeCorner)} aria-hidden="true" /> : null}
      {attach === "pin" ? <span className={styles.pin} aria-hidden="true" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- scans are pre-sized WebP from R2 (ADR-001); no server optimisation */}
      <img className={styles.image} src={src} alt={alt} loading="lazy" style={{ aspectRatio: aspect }} />
      {showFoot ? (
        <figcaption className={styles.foot}>
          <span className={cx(styles.caption, oops && styles.oopsCaption)}>{caption}</span>
          {date ? <span className={styles.date}>{date}</span> : null}
        </figcaption>
      ) : null}
      {children}
    </figure>
  );
}
