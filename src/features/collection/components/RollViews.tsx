"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FilmStrip } from "@/design-system";
import { FrameGrid } from "@/features/frames/components/FrameGrid";
import type { IRollFrame } from "@/features/frames/core";
import { FRAME_FILTERS, filterCounts, matchesFilter, type TFrameFilter } from "../filters";
import { useMediaQuery } from "../use-media-query";
import type { TRollView } from "../view-pref";
import { FilterChips } from "./FilterChips";
import { Lightbox } from "./Lightbox";
import { ViewSwitch } from "./ViewSwitch";
import styles from "./RollViews.module.css";

export interface RollViewsProps {
  rollId: string;
  frames: IRollFrame[];
  view: TRollView;
  /** The grid's filter; the strip always shows the whole roll. */
  filter: TFrameFilter;
  /** The strip's lower rail, e.g. "GOLD 200 · CUỘN 14". */
  edgeText: string;
}

/** COL-1 / COL-2: Dải phim (default) or Lưới, filter chips on the grid, one lightbox for both. */
export function RollViews({ rollId, frames, view, filter, edgeText }: RollViewsProps) {
  const t = useTranslations("rollViews");
  const tFilters = useTranslations("filters");
  const wide = useMediaQuery("(min-width: 600px)");
  const [open, setOpen] = useState<number | null>(null);
  const counts = useMemo(() => filterCounts(frames), [frames]);
  const shown = useMemo(() => (view === "grid" ? frames.filter((f) => matchesFilter(f, filter)) : frames), [frames, filter, view]);
  const href = (v: TRollView, f: TFrameFilter) => `/rolls/${rollId}?view=${v}&filter=${f}`;
  const filtered = view === "grid" && filter !== "all";

  return (
    <div className={styles.views}>
      <ViewSwitch surface="roll" current={view} hrefs={{ strip: `/rolls/${rollId}?view=strip`, grid: href("grid", filter) }} />
      {view === "strip" ? (
        <>
          <FilmStrip
            className={styles.strip}
            frameWidth={wide ? 200 : 150}
            labels={{ strip: t("strip"), keeper: t("keeper"), oops: t("oops") }}
            edgeText={edgeText}
            frames={frames.map((f, i) => ({
              src: f.isBlank ? undefined : f.gridUrl,
              alt: f.isBlank ? t("blankFrame", { n: f.position }) : t("frame", { n: f.position }),
              number: f.position,
              flag: f.isKeeper ? "keeper" : f.isOops ? "oops" : undefined,
              onClick: () => setOpen(i),
            }))}
          />
          <p className={styles.hint}>
            <span className={styles.touch}>{t("stripHintTouch")}</span>
            <span className={styles.pointer}>{t("stripHintPointer")}</span>
          </p>
        </>
      ) : (
        <>
          <FilterChips filters={FRAME_FILTERS} current={filter} counts={counts} hrefFor={(f) => href("grid", f)} />
          {shown.length === 0 ? <p className={styles.empty}>{t("emptyFilter")}</p> : <FrameGrid rollId={rollId} frames={shown} onOpen={setOpen} />}
        </>
      )}
      {open !== null ? (
        <Lightbox
          frames={shown}
          index={open}
          total={frames.length}
          filterLabel={filtered ? tFilters(filter) : undefined}
          edgeText={edgeText}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
          detailHref={(f) => `/rolls/${rollId}/frames/${f.id}`}
        />
      ) : null}
    </div>
  );
}
