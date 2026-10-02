"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Canister } from "@/components/canister/Canister";
import { Button, ButtonLink, Icon } from "@/design-system";
import { toCanisterProps } from "@/features/canister/to-canister-props";
import { FrameGrid } from "@/features/frames/components/FrameGrid";
import type { IRollFrame } from "@/features/frames/core";
import type { IRollEntry } from "@/features/rolls/core";
import { formatRollDate } from "@/features/rolls/format-date";
import { listLibraryAction } from "../actions";
import type { ILibraryGroup, ILibraryPage, TLibraryFilter } from "../core";
import { FilterChips } from "./FilterChips";
import { Lightbox } from "./Lightbox";
import styles from "./LibraryGrid.module.css";

const LIBRARY_FILTERS = ["all", "keeper", "oops"] as const;
/** The first row of the first group; every later cell waits for the scroll (the 2 s first-row gate). */
const FIRST_ROW = 6;

type TRollNaming = Pick<IRollEntry, "name"> & Partial<Pick<IRollEntry, "number" | "stock">>;
type TTranslate = ReturnType<typeof useTranslations<"library">>;

/** The roll's own name, else "Cuộn #N" (N1), else its film — the shelf's rule. */
function rollName(roll: TRollNaming, t: TTranslate): string {
  if (roll.name) return roll.name;
  if (roll.number != null) return t("unnamedRoll", { number: roll.number });
  return roll.stock ? `${roll.stock.brand} ${roll.stock.name}` : t("unnamedRoll", { number: "?" });
}

/** The board's mono line under the name: "GOLD 200 · 36 TẤM · 12.10.25". */
function rollMeta(group: ILibraryGroup, t: TTranslate): string {
  const { roll } = group;
  return [
    roll.stock?.name.toUpperCase(),
    t("rollFrames", { count: roll.frameCount ?? group.frames.length }),
    formatRollDate(roll.shotFrom, roll.datePrecision ?? "day"),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Appends `next` after `shown`, skipping rolls already shown (Ruling R27: a refresh between pages can send one again). */
function appendGroups(shown: ILibraryGroup[], next: ILibraryGroup[]): ILibraryGroup[] {
  const seen = new Set(shown.map((g) => g.roll.id));
  return [...shown, ...next.filter((g) => !seen.has(g.roll.id))];
}

export interface LibraryGridProps {
  initial: ILibraryPage;
  filter: TLibraryFilter;
  /** The next page; the Server Action unless a test passes its own. */
  loadMore?: typeof listLibraryAction;
  /** `LibraryGridKeepersEmpty`: the empty Tấm ưng state links to this roll's grid. */
  newestRoll?: TRollNaming & Pick<IRollEntry, "id">;
}

/**
 * COL-3, the `LibraryGrid` boards: every frame grouped by roll, newest roll
 * first, filtered by Tất cả / Tấm ưng / Oops, one lightbox across rolls in
 * the order shown. No selection here (D14): a click opens. "Xem thêm cuộn"
 * appends the next page of rolls.
 */
export function LibraryGrid({ initial, filter, loadMore = listLibraryAction, newestRoll }: LibraryGridProps) {
  const t = useTranslations("library");
  const tFilters = useTranslations("filters");
  const [groups, setGroups] = useState(initial.groups);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // A ref too, so a second press before the next render still makes one call.
  const inFlight = useRef(false);
  const [open, setOpen] = useState<number | null>(null);
  // R21: the cell that opened the lightbox; focus goes back there on close.
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  const { frames, offsets, rollOf } = useMemo(() => {
    const rollOf = new Map<string, { rollId: string; total: number }>();
    const offsets: number[] = [];
    const frames: IRollFrame[] = [];
    for (const g of groups) {
      offsets.push(frames.length);
      const total = g.roll.frameCount ?? g.frames.length;
      for (const f of g.frames) {
        frames.push(f);
        rollOf.set(f.id, { rollId: g.roll.id, total });
      }
    }
    return { frames, offsets, rollOf };
  }, [groups]);

  const more = async () => {
    if (!cursor || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const next = await loadMore({ filter, cursor });
      setGroups((shown) => appendGroups(shown, next.groups));
      setCursor(next.nextCursor);
    } catch {
      setFailed(true); // offline or a redeploy: what's shown stays, the button stays for another go
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.library}>
      <FilterChips
        filters={LIBRARY_FILTERS}
        current={filter}
        counts={{ ...initial.counts, blank: 0 }}
        hrefFor={(f) => `/?view=grid&filter=${f}`}
      />

      {groups.length === 0 ? (
        filter === "keeper" ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Icon name="keeper" size={28} />
            </span>
            <h2 className={styles.emptyTitle}>{t("emptyKeepers")}</h2>
            <p className={styles.emptyBody}>
              <span className={styles.hintTouch}>{t("emptyKeepersHintTouch")}</span>
              <span className={styles.hintPointer}>{t("emptyKeepersHintPointer")}</span>
            </p>
            {newestRoll ? (
              <ButtonLink href={`/rolls/${newestRoll.id}?view=grid`} variant="outline" className={styles.emptyCta}>
                {t("openNewest", { name: rollName(newestRoll, t) })}
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <p className={styles.note}>{filter === "all" ? t("empty") : t("emptyFilter")}</p>
        )
      ) : (
        <div className={styles.groups}>
          {groups.map((g, gi) => {
            const name = rollName(g.roll, t);
            const headingId = `library-roll-${g.roll.id}`;
            return (
              <section key={g.roll.id} className={styles.group} aria-labelledby={headingId}>
                <div className={styles.head}>
                  <Canister color={toCanisterProps(g.roll, name).color} size="sm" className={styles.canister} />
                  <div className={styles.titles}>
                    <h2 id={headingId} className={styles.name}>
                      {name}
                    </h2>
                    <p className={styles.meta}>{rollMeta(g, t)}</p>
                  </div>
                  <Link href={`/rolls/${g.roll.id}`} className={styles.open} aria-label={t("openRollLabel", { name })}>
                    {t("openRoll")}
                  </Link>
                </div>
                <FrameGrid
                  rollId={g.roll.id}
                  frames={g.frames}
                  eager={gi === 0 ? FIRST_ROW : 0}
                  onOpen={(i, cell) => {
                    setOpener(cell);
                    setOpen(offsets[gi] + i);
                  }}
                />
              </section>
            );
          })}
        </div>
      )}

      {failed ? (
        <p role="alert" className={styles.error}>
          {t("moreFailed")}
        </p>
      ) : null}
      {cursor ? (
        <Button variant="outline" className={styles.more} disabled={loading} aria-busy={loading || undefined} onClick={() => void more()}>
          {t("more")}
        </Button>
      ) : null}

      {open !== null ? (
        <Lightbox
          frames={frames}
          index={open}
          total={(f) => rollOf.get(f.id)?.total ?? frames.length}
          filterLabel={filter === "all" ? undefined : tFilters(filter)}
          filterTotal={filter === "all" ? undefined : initial.counts[filter]}
          returnFocusTo={opener}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
          detailHref={(f) => `/rolls/${rollOf.get(f.id)?.rollId}/frames/${f.id}`}
        />
      ) : null}
    </div>
  );
}
