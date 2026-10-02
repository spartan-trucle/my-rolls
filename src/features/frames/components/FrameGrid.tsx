import { useTranslations } from "next-intl";
import Link from "next/link";
import { Icon } from "@/design-system";
import type { IRollFrame } from "../core";
import styles from "./FrameGrid.module.css";

/** The first row loads eagerly (6 on desktop); the rest lazily. The 2 s first-row launch gate. */
const EAGER = 6;

export interface FrameGridProps {
  rollId: string;
  frames: IRollFrame[];
  /**
   * COL-2: cells become buttons that open frame `index` (of `frames`) in the
   * lightbox. Until Task 9's selection lands, a single click or tap opens on
   * every pointer (Ruling R19). Without it, cells link to each FrameView.
   */
  onOpen?: (index: number) => void;
}

/** The `RollGrid` board's numbered grid on film (SCAN-4, COL-1): 3 columns on phones, 6 on desktop. */
export function FrameGrid({ rollId, frames, onOpen }: FrameGridProps) {
  const t = useTranslations("frames");
  return (
    <ol className={styles.grid}>
      {frames.map((f, i) => {
        const label = [
          t("frameLabel", { n: f.position }),
          f.isKeeper ? t("keeperSuffix") : null,
          f.isOops ? t("oopsSuffix") : null,
          f.isBlank ? t("blankSuffix") : null,
        ]
          .filter(Boolean)
          .join(", ");
        const className = f.isBlank ? `${styles.cell} ${styles.blank}` : styles.cell;
        const body = (
          <>
            {f.isBlank ? (
              <span className={styles.blankText} aria-hidden="true">
                {t("blankCell")}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public copies, already sized in the browser (D11)
              <img
                className={styles.img}
                src={f.gridUrl}
                alt=""
                width={f.width ?? undefined}
                height={f.height ?? undefined}
                loading={i < EAGER ? "eager" : "lazy"}
                decoding="async"
              />
            )}
            <span className={styles.num}>{f.position}</span>
            {f.isKeeper || f.isOops ? (
              <span className={styles.flags}>
                {f.isKeeper ? (
                  <span className={styles.keeper} role="img" aria-label={t("keeperIcon")}>
                    <Icon name="keeper" size={14} />
                  </span>
                ) : null}
                {f.isOops ? (
                  <span className={styles.oops} role="img" aria-label={t("oopsIcon")}>
                    <Icon name="oops" size={14} />
                  </span>
                ) : null}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={f.id}>
            {onOpen ? (
              <button type="button" className={className} aria-label={label} onClick={() => onOpen(i)}>
                {body}
              </button>
            ) : (
              <Link href={`/rolls/${rollId}/frames/${f.id}`} className={className} aria-label={label}>
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
