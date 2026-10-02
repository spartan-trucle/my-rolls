import { useTranslations } from "next-intl";
import Link from "next/link";
import { Icon } from "@/design-system";
import type { IRollFrame } from "../core";
import styles from "./FrameGrid.module.css";

/** The first row loads eagerly (6 on desktop); the rest lazily. The 2 s first-row launch gate. */
const EAGER = 6;

/** The `RollFrames` board's numbered grid (SCAN-4): 3 columns on phones, 6 on desktop. */
export function FrameGrid({ rollId, frames }: { rollId: string; frames: IRollFrame[] }) {
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
        return (
          <li key={f.id}>
            <Link href={`/rolls/${rollId}/frames/${f.id}`} className={f.isBlank ? `${styles.cell} ${styles.blank}` : styles.cell} aria-label={label}>
              {f.isBlank ? null : (
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
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
