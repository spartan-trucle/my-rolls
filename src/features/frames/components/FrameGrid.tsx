"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Icon, cx } from "@/design-system";
import type { IRollFrame } from "../core";
import styles from "./FrameGrid.module.css";

/** The first row loads eagerly (6 on desktop); the rest lazily. The 2 s first-row launch gate. */
const EAGER = 6;
/** D11 long-press: held this long without moving further than SLOP px. */
const LONG_PRESS_MS = 500;
const SLOP = 10;

export interface FrameGridProps {
  rollId: string;
  frames: IRollFrame[];
  /**
   * COL-2: cells become buttons that open frame `index` (of `frames`) in the
   * lightbox (a click or tap, or Enter, when there is no selection). Without
   * it, cells link to each FrameView.
   * `cell` is the button, for returning focus to it (R21).
   */
  onOpen?: (index: number, cell: HTMLButtonElement) => void;
  /**
   * COL-4 (D11), with `onOpen`: the picked frames' ids. Passing `onToggle`
   * turns selection on: on a fine pointer a click toggles (Shift for a
   * range) and double-click / Enter open; on a coarse one a tap opens
   * unless `selecting`, then it toggles, and a long-press calls `onLongPress`.
   */
  selectedIds?: ReadonlySet<string>;
  pointer?: "fine" | "coarse";
  selecting?: boolean;
  onToggle?: (id: string, opts: { shift: boolean }) => void;
  onLongPress?: (id: string) => void;
}

interface IPress {
  id: string;
  x: number;
  y: number;
  timer: ReturnType<typeof setTimeout>;
}

/** The `RollGrid` board's numbered grid on film (SCAN-4, COL-1): 3 columns on phones, 6 on desktop. */
export function FrameGrid({ rollId, frames, onOpen, selectedIds, pointer = "fine", selecting = false, onToggle, onLongPress }: FrameGridProps) {
  const t = useTranslations("frames");
  const selectable = onOpen !== undefined && onToggle !== undefined;
  const press = useRef<IPress | null>(null);
  // The cell whose long-press just fired: the click the browser sends after it must not toggle it back or open it.
  const swallow = useRef<string | null>(null);

  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  useEffect(() => cancelPress, []);

  const onPointerDown = (id: string, e: ReactPointerEvent<HTMLButtonElement>) => {
    swallow.current = null;
    cancelPress();
    if (!onLongPress || e.pointerType === "mouse") return;
    press.current = {
      id,
      x: e.clientX ?? 0,
      y: e.clientY ?? 0,
      timer: setTimeout(() => {
        press.current = null;
        swallow.current = id;
        onLongPress(id);
      }, LONG_PRESS_MS),
    };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (p && Math.hypot((e.clientX ?? 0) - p.x, (e.clientY ?? 0) - p.y) > SLOP) cancelPress();
  };

  const activate = (i: number, id: string, cell: HTMLButtonElement, shift: boolean) => {
    if (swallow.current === id) {
      swallow.current = null;
      return;
    }
    if (!onToggle || (pointer === "coarse" && !selecting)) onOpen?.(i, cell);
    else onToggle(id, { shift: pointer === "fine" && shift });
  };

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
        const selected = selectable && (selectedIds?.has(f.id) ?? false);
        const className = cx(styles.cell, f.isBlank && styles.blank, selectable && styles.selectable, selected && styles.selected);
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
                draggable={false}
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
            {selected ? (
              <span className={styles.tick} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            ) : null}
          </>
        );
        return (
          <li key={f.id}>
            {onOpen ? (
              <button
                type="button"
                className={className}
                aria-label={label}
                aria-pressed={selectable ? selected : undefined}
                onClick={(e) => activate(i, f.id, e.currentTarget, e.shiftKey)}
                onKeyDown={(e) => {
                  // Enter opens on every pointer; Space stays the button's own click (toggle when selecting).
                  if (e.key !== "Enter" || e.repeat) return;
                  e.preventDefault();
                  onOpen(i, e.currentTarget);
                }}
                onDoubleClick={selectable && pointer === "fine" ? (e) => onOpen(i, e.currentTarget) : undefined}
                onPointerDown={selectable ? (e) => onPointerDown(f.id, e) : undefined}
                onPointerMove={selectable ? onPointerMove : undefined}
                onPointerUp={selectable ? cancelPress : undefined}
                onPointerCancel={selectable ? cancelPress : undefined}
                onPointerLeave={selectable ? cancelPress : undefined}
                // No long-press menu (Android) on a cell that selects by long-press.
                onContextMenu={selectable && pointer === "coarse" ? (e) => e.preventDefault() : undefined}
              >
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
