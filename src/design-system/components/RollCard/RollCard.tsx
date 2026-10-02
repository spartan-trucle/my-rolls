import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Stamp } from "../Stamp/Stamp";
import styles from "./RollCard.module.css";

/** Film family, never brand: warm neg gold, cool neg green, slide blue, B&W mono, everything else rose. */
export type Stock = "gold" | "green" | "blue" | "mono" | "rose";

export interface RollCount {
  count: number;
  /** Accessible name, e.g. "5 tấm ưng". */
  label: string;
}

export interface RollCardProps {
  name: ReactNode;
  stock?: Stock;
  iso?: number | string;
  /** The stock's name as text; never a logo. */
  film?: string;
  exposures?: number;
  camera?: string;
  /** dd.mm.yy */
  date?: string;
  oops?: RollCount;
  keepers?: RollCount;
  /** Makes the whole card a link. */
  href?: string;
  /** Extra stamp before oops and keepers, e.g. upload progress (Phase 2 HomeUploading board). */
  status?: ReactNode;
  className?: string;
}

const joinMeta = (parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" · ");

export function RollCard({ name, stock = "gold", iso, film, exposures, camera, date, oops, keepers, href, status, className }: RollCardProps) {
  const filmLine = joinMeta([film, iso != null && `ISO ${iso}`, exposures != null && `${exposures} EXP`]);
  const cameraLine = joinMeta([camera, date]);
  const canStyle = { "--rc-stock": `var(--stock-${stock})` } as CSSProperties;

  const content = (
    <>
      <div className={styles.can} style={canStyle} aria-hidden="true">
        <div className={styles.canCap} />
        <div className={styles.canBody}>
          <div className={styles.canLabel}>{iso}</div>
        </div>
        <div className={styles.canLeader} />
      </div>
      <div>
        <p className={styles.name}>{name}</p>
        {filmLine ? <p className={styles.meta}>{filmLine}</p> : null}
        {cameraLine ? <p className={styles.meta}>{cameraLine}</p> : null}
      </div>
      <div className={styles.side}>
        {status}
        {oops ? <Stamp tone="oops" icon="oops" label={oops.label}>{oops.count}</Stamp> : null}
        {keepers ? <Stamp tone="keeper" icon="keeper" label={keepers.label}>{keepers.count}</Stamp> : null}
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={cx(styles.card, className)}>
      {content}
    </Link>
  ) : (
    <div className={cx(styles.card, className)}>{content}</div>
  );
}
