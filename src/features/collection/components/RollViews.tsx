"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { Button, FilmStrip } from "@/design-system";
import { setFramesMarksAction } from "@/features/frames/actions";
import { FrameGrid } from "@/features/frames/components/FrameGrid";
import type { IRollFrame } from "@/features/frames/core";
import { addMistakesToFramesAction } from "@/features/mistakes/actions";
import { MistakePicker, type TMistakeItem } from "@/features/mistakes/components/MistakePicker";
import { FRAME_FILTERS, filterCounts, matchesFilter, type TFrameFilter } from "../filters";
import { nextMarkValue } from "../selection";
import { useFrameSelection, useMarkShortcuts } from "../use-frame-selection";
import { useMediaQuery } from "../use-media-query";
import type { TRollView } from "../view-pref";
import { FilterChips } from "./FilterChips";
import { Lightbox } from "./Lightbox";
import { SelectionBar } from "./SelectionBar";
import { ViewSwitch } from "./ViewSwitch";
import styles from "./RollViews.module.css";

type TVia = "button" | "key";
type TMarkFrames = (input: { rollId: string; frameIds: string[]; mark: "keeper" | "blank"; on: boolean; via: TVia }) => Promise<{ ok: boolean }>;
type TAddMistakes = (input: { rollId: string; frameIds: string[]; items: TMistakeItem[]; via: TVia }) => Promise<{ ok: boolean }>;

const NO_FRAMES: IRollFrame[] = [];

export interface RollViewsProps {
  rollId: string;
  frames: IRollFrame[];
  view: TRollView;
  /** The grid's filter; the strip always shows the whole roll. */
  filter: TFrameFilter;
  /** The strip's lower rail, e.g. "GOLD 200 · CUỘN 14". */
  edgeText: string;
  /** COL-4 bulk saves (R24); the Server Actions unless a test passes its own. */
  markFrames?: TMarkFrames;
  addMistakes?: TAddMistakes;
  /**
   * D11: "fine" (click selects) or "coarse" (tap opens, long-press selects).
   * Defaults to the primary pointer; `false` from `useMediaQuery` on the
   * server and first render reads as fine, the same one-render settle as
   * the strip's width.
   */
  pointer?: "fine" | "coarse";
}

/** COL-1 / COL-2 / COL-4: Dải phim (default) or Lưới, filter chips and bulk marking on the grid, one lightbox for both. */
export function RollViews({
  rollId,
  frames,
  view,
  filter,
  edgeText,
  markFrames = setFramesMarksAction,
  addMistakes = addMistakesToFramesAction,
  pointer: pointerProp,
}: RollViewsProps) {
  const t = useTranslations("rollViews");
  const tFilters = useTranslations("filters");
  const tSel = useTranslations("selection");
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 600px)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const pointer = pointerProp ?? (coarse ? "coarse" : "fine");
  const [open, setOpen] = useState<number | null>(null);
  // R21: the cell or strip frame that opened the lightbox; focus goes back there on close.
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const openFrom = (i: number, el: HTMLElement) => {
    setOpener(el);
    setOpen(i);
  };
  const counts = useMemo(() => filterCounts(frames), [frames]);
  const shown = useMemo(() => (view === "grid" ? frames.filter((f) => matchesFilter(f, filter)) : frames), [frames, filter, view]);
  const href = (v: TRollView, f: TFrameFilter) => `/rolls/${rollId}?view=${v}&filter=${f}`;
  const filtered = view === "grid" && filter !== "all";

  // COL-4: selection lives on the grid only.
  const grid = view === "grid";
  const sel = useFrameSelection(grid ? shown : NO_FRAMES);
  const count = sel.selected.size;
  const [selectMode, setSelectMode] = useState(false); // the phone's "Chọn"
  const [busy, setBusy] = useState(false);
  // R22: also a ref, so two key presses before the next render still make one call.
  const inFlight = useRef(false);
  const beginSave = () => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    return true;
  };
  const endSave = () => {
    inFlight.current = false;
    setBusy(false);
  };
  const [error, setError] = useState<string | null>(null);
  // The frames the open bulk picker adds to, fixed when it opened, and how it was opened.
  const [picker, setPickerState] = useState<{ frames: IRollFrame[]; via: TVia } | null>(null);
  // Whether the picker is still open when a save settles: it may have been closed mid-save.
  const pickerOpen = useRef(false);
  const setPicker = (next: { frames: IRollFrame[]; via: TVia } | null) => {
    pickerOpen.current = next !== null;
    setPickerState(next);
  };

  const clearSelection = () => {
    sel.clear();
    setSelectMode(false);
    setError(null);
  };

  const mark = async (kind: "keeper" | "blank", via: TVia) => {
    if (sel.selectedFrames.length === 0 || !beginSave()) return;
    try {
      const result = await markFrames({
        rollId,
        frameIds: sel.selectedFrames.map((f) => f.id),
        mark: kind,
        on: nextMarkValue(sel.selectedFrames, kind),
        via,
      });
      if (!result.ok) return setError(tSel("markFailed"));
      setError(null);
      // R23: the new marks come back with the page; frames the filter drops leave the selection.
      router.refresh();
    } catch {
      setError(tSel("markFailed")); // R22: a network error or a redeploy; the selection stays for another go
    } finally {
      endSave();
    }
  };

  const openPicker = (via: TVia) => {
    if (sel.selectedFrames.length === 0 || inFlight.current) return;
    setError(null);
    setPicker({ frames: sel.selectedFrames, via });
  };

  const submitMistakes = async (items: TMistakeItem[]) => {
    if (!picker || !beginSave()) return { ok: false };
    try {
      const result = await addMistakes({ rollId, frameIds: picker.frames.map((f) => f.id), items, via: picker.via });
      if (result.ok) {
        setPicker(null);
        router.refresh();
      } else if (!pickerOpen.current) {
        setError(tSel("markFailed")); // closed mid-save: the bar says so instead, and the selection stays
      }
      return result;
    } catch (err) {
      if (pickerOpen.current) throw err; // the open picker says so and stays open
      setError(tSel("markFailed"));
      return { ok: false };
    } finally {
      endSave();
    }
  };

  useMarkShortcuts(grid && shown.length > 0 && open === null && picker === null, {
    keeper: () => void mark("keeper", "key"),
    oops: () => openPicker("key"),
    blank: () => void mark("blank", "key"),
    clear: () => {
      if (inFlight.current || (count === 0 && !selectMode)) return; // Esc with nothing picked does nothing
      clearSelection();
    },
    selectAll: sel.selectAll,
  });

  const longPress = (id: string) => {
    if (!sel.selected.has(id)) sel.toggle(id);
  };

  return (
    <div className={styles.views}>
      <div className={styles.switchRow}>
        <ViewSwitch surface="roll" current={view} hrefs={{ strip: `/rolls/${rollId}?view=strip`, grid: href("grid", filter) }} />
        {grid ? (
          // RollGrid: "Chọn" starts selecting on phones (a desktop click already selects).
          <Button
            variant="outline"
            size="sm"
            className={styles.start}
            aria-pressed={selectMode || count > 0}
            onClick={() => (selectMode || count > 0 ? clearSelection() : setSelectMode(true))}
          >
            {tSel("start")}
          </Button>
        ) : null}
      </div>
      {view === "strip" ? (
        <>
          {/* R20: the named region is the roll page's, so FilmStrip's own markup stays as the landing page uses it. */}
          <section aria-label={t("strip")} className={styles.stripRegion}>
            <FilmStrip
              className={styles.strip}
              frameWidth={wide ? 200 : 150}
              labels={{ strip: t("stripFrames", { count: frames.length }), keeper: t("keeper"), oops: t("oops") }}
              edgeText={edgeText}
              frames={frames.map((f, i) => ({
                src: f.isBlank ? undefined : f.gridUrl,
                alt: f.isBlank ? t("blankFrame", { n: f.position }) : t("frame", { n: f.position }),
                number: f.position,
                flag: f.isKeeper ? "keeper" : f.isOops ? "oops" : undefined,
                onClick: (e) => openFrom(i, e.currentTarget),
              }))}
            />
          </section>
          <p className={styles.hint}>
            <span className={styles.touch}>{t("stripHintTouch")}</span>
            <span className={styles.pointer}>{t("stripHintPointer")}</span>
          </p>
        </>
      ) : (
        <>
          <div className={styles.toolbar}>
            <FilterChips filters={FRAME_FILTERS} current={filter} counts={counts} hrefFor={(f) => href("grid", f)} />
            <SelectionBar
              count={count}
              busy={busy}
              error={error}
              pressed={{ keeper: !nextMarkValue(sel.selectedFrames, "keeper"), blank: !nextMarkValue(sel.selectedFrames, "blank") }}
              onKeeper={() => void mark("keeper", "button")}
              onOops={() => openPicker("button")}
              onBlank={() => void mark("blank", "button")}
              onClear={clearSelection}
            />
          </div>
          {shown.length === 0 ? (
            <p className={styles.empty}>{t("emptyFilter")}</p>
          ) : (
            <>
              <FrameGrid
                rollId={rollId}
                frames={shown}
                onOpen={openFrom}
                selectedIds={sel.selected}
                pointer={pointer}
                selecting={selectMode || count > 0}
                onToggle={(id, { shift }) => sel.click(id, { shift })}
                onLongPress={longPress}
              />
              <p className={styles.hint}>
                <span className={styles.hintTouch}>{tSel("hintTouch")}</span>
                <span className={styles.hintPointer}>{tSel("hintDesktop")}</span>
              </p>
            </>
          )}
          {/* The phone's docked bar covers the page's end; this keeps the last of it reachable. */}
          {count > 0 ? <div className={styles.barSpace} aria-hidden="true" /> : null}
          <ResponsiveDialog open={picker !== null} onClose={() => setPicker(null)} labelledBy="mistake-picker-title">
            {picker ? <MistakePicker bulk={{ frames: picker.frames, onSubmit: submitMistakes, onCancel: () => setPicker(null) }} /> : null}
          </ResponsiveDialog>
        </>
      )}
      {open !== null ? (
        <Lightbox
          frames={shown}
          index={open}
          total={frames.length}
          filterLabel={filtered ? tFilters(filter) : undefined}
          edgeText={edgeText}
          returnFocusTo={opener}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
          detailHref={(f) => `/rolls/${rollId}/frames/${f.id}`}
        />
      ) : null}
    </div>
  );
}
