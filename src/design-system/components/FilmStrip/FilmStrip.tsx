import type { CSSProperties } from "react";
import { cx } from "@/design-system/cx";
import { Stamp } from "../Stamp/Stamp";
import styles from "./FilmStrip.module.css";

export interface FilmFrame {
  /** No src = a blank frame. */
  src?: string;
  /** Describes the photo, or says the frame is blank ("Khung 14, trống"). */
  alt: string;
  /** Printed on the edge; defaults to the frame's position. */
  number?: number | string;
  /** Flag only a few frames. */
  flag?: "keeper" | "oops";
  onClick?: () => void;
}

export interface FilmStripLabels {
  /** Accessible name of the strip. */
  strip: string;
  keeper: string;
  oops: string;
}

export interface FilmStripProps {
  frames: FilmFrame[];
  labels: FilmStripLabels;
  /** px. 150 on phones, 180–220 on desktop. */
  frameWidth?: number;
  /** Stock line on the lower rail, e.g. "COLOR 200 · ROLL 14". */
  edgeText?: string;
  className?: string;
  style?: CSSProperties;
}

function Holes({ count }: { count: number }) {
  return (
    <div className={styles.holes} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={styles.hole} />
      ))}
    </div>
  );
}

function FramePicture({ frame }: { frame: FilmFrame }) {
  const picture = frame.src ? (
    // eslint-disable-next-line @next/next/no-img-element -- scans are pre-sized WebP from R2 (ADR-001)
    <img className={styles.image} src={frame.src} alt={frame.alt} loading="lazy" />
  ) : (
    <div className={cx(styles.image, styles.blank)} role="img" aria-label={frame.alt} />
  );
  if (!frame.onClick) return picture;
  return (
    <button type="button" className={styles.frameButton} onClick={frame.onClick}>
      {picture}
    </button>
  );
}

export function FilmStrip({ frames, labels, frameWidth = 200, edgeText = "", className, style }: FilmStripProps) {
  const holeCount = Math.max(4, Math.round(frameWidth / 24));
  const stripStyle = { ...style, "--rc-frame-w": `${frameWidth}px` } as CSSProperties;

  return (
    <ul className={cx(styles.strip, className)} style={stripStyle} aria-label={labels.strip}>
      {frames.map((frame, i) => {
        const num = frame.number != null ? String(frame.number) : String(i + 1);
        return (
          <li key={`${num}-${i}`} className={styles.frame}>
            <div className={styles.edge} aria-hidden="true">
              <span>{num}</span>
              <span>{`▸${num}A`}</span>
            </div>
            <Holes count={holeCount} />
            <FramePicture frame={frame} />
            {frame.flag ? (
              <span className={styles.flag}>
                <Stamp tone={frame.flag} solid icon={frame.flag} label={labels[frame.flag]} className={styles.flagStamp} />
              </span>
            ) : null}
            <Holes count={holeCount} />
            <div className={styles.edge} aria-hidden="true">
              <span>{edgeText}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
