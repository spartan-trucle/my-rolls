import Link from "next/link";
import { useTranslations } from "next-intl";
import type { TFrameFilter } from "../filters";
import styles from "./FilterChips.module.css";

export interface FilterChipsProps {
  filters: readonly TFrameFilter[];
  current: TFrameFilter;
  /** Over the whole roll, not the filtered list (COL-2). */
  counts: Record<TFrameFilter, number>;
  hrefFor: (filter: TFrameFilter) => string;
}

/**
 * COL-2: the `RollGrid` boards' `.chip` row. Each chip is a link (the filter
 * lives in the URL, plan D8); the current one is `aria-current`. Scrolls
 * sideways, full bleed, on phones; wraps on desktop.
 */
export function FilterChips({ filters, current, counts, hrefFor }: FilterChipsProps) {
  const t = useTranslations("filters");
  return (
    <div className={styles.scroller}>
      <div role="group" aria-label={t("label")} className={styles.row}>
        {filters.map((f) => (
          <Link key={f} href={hrefFor(f)} scroll={false} className={styles.chip} aria-current={f === current ? "true" : undefined}>
            {t(f)}
            <span className={styles.count}>{counts[f]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
