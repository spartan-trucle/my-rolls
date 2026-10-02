"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { DialogCloseButton } from "@/components/overlay/DialogCloseButton";
import { Stamp } from "@/design-system";
import type { IRollFrame } from "@/features/frames/core";
import styles from "./Lightbox.module.css";

const SWIPE_PX = 50;
const HISTORY_KEY = "cuonLightbox";
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface LightboxProps {
  /** The frames it walks through, already filtered (COL-2). */
  frames: IRollFrame[];
  index: number;
  /** Total frames on the roll, for "Tấm 14/36". Defaults to `frames.length`. */
  total?: number;
  /** Ruling R17: opened from a grid filter other than "all", e.g. "Oops" → "Tấm 3/36 · Oops 1/3". */
  filterLabel?: string;
  /** The strip's edge print, e.g. "GOLD 200 · CUỘN 14"; the frame number is appended. */
  edgeText?: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  detailHref: (f: IRollFrame) => string;
}

function hasOwnEntry(): boolean {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && HISTORY_KEY in state;
}

/**
 * COL-2, plan D10: one frame large on film, the 2048 px copy. ← → or a
 * sideways swipe walk `frames` without wrapping; Esc, the × or phone Back
 * close it. It pushes one history entry on open so Back closes it, and
 * drops that entry itself when closed any other way.
 */
export function Lightbox({ frames, index, total, filterLabel, edgeText, onIndexChange, onClose, detailHref }: LightboxProps) {
  const t = useTranslations("lightbox");
  const frame = frames[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const closed = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const go = (to: number) => {
    if (to >= 0 && to < frames.length && to !== index) onIndexChange(to);
  };

  /** Esc or the ×: close, then drop the entry pushed on open. A Back press already popped it. */
  const requestClose = () => {
    if (closed.current) return;
    closed.current = true;
    onCloseRef.current();
    if (hasOwnEntry()) window.history.back();
  };

  // One history entry per open. Keeps Next's own state (spread) so the router still owns the entry;
  // skips the push when the entry is already ours (React's dev double-mount).
  useEffect(() => {
    if (!hasOwnEntry()) window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: true }, "");
    const onPop = () => {
      if (closed.current) return;
      closed.current = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Focus moves in on open and back to whatever opened it on close; the page behind doesn't scroll.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Warm the neighbours' 2048 px copies so ← → feel instant.
  useEffect(() => {
    for (const n of [frames[index - 1], frames[index + 1]]) if (n && !n.isBlank) new Image().src = n.viewUrl;
  }, [frames, index]);

  // Only ever opened by a click, so it never renders on the server: `document` is there for the portal.
  if (!frame) return null;

  const label = frame.isBlank ? t("blank", { n: frame.position }) : t("frame", { n: frame.position });
  const count = filterLabel
    ? t("positionFiltered", { n: frame.position, total: total ?? frames.length, filter: filterLabel, i: index + 1, count: frames.length })
    : t("position", { n: frame.position, total: total ?? frames.length });

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    // The phone layout hides the ‹ › buttons; skip what isn't rendered.
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => (typeof el.checkVisibility === "function" ? el.checkVisibility() : window.getComputedStyle(el).display !== "none"),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? index + 1 : index - 1);
  };

  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={label} className={styles.lightbox} onKeyDown={trapTab}>
      <div className={styles.bar}>
        <DialogCloseButton ref={closeRef} onClose={requestClose} className={styles.close} />
        <span className={styles.count} aria-live="polite">
          {count}
        </span>
        <Link href={detailHref(frame)} className={styles.detail}>
          {t("detail")}
        </Link>
      </div>

      <div className={styles.middle}>
        <button type="button" className={styles.nav} onClick={() => go(index - 1)} disabled={index === 0} aria-label={t("prev")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div
          data-testid="lightbox-stage"
          className={styles.stage}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeStart.current = null)}
        >
          {frame.isBlank ? (
            <div role="img" aria-label={label} className={styles.blank}>
              <span aria-hidden="true">{t("blankTile")}</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- the 2048 px copy from R2 (COL build notes)
            <img key={frame.id} className={styles.image} src={frame.viewUrl} alt={label} draggable={false} />
          )}
        </div>
        <button type="button" className={styles.nav} onClick={() => go(index + 1)} disabled={index === frames.length - 1} aria-label={t("next")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className={styles.foot}>
        <div className={styles.stamps}>
          {frame.isKeeper ? (
            <Stamp tone="keeper" icon="keeper" solid label={t("keeper")}>
              {t("keeper")}
            </Stamp>
          ) : null}
          {frame.isOops ? (
            <Stamp tone="oops" icon="oops" solid label={t("oops")}>
              {t("oops")}
            </Stamp>
          ) : null}
        </div>
        <span className={`${styles.hint} ${styles.hintSwipe}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {t("hintSwipe")}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span className={`${styles.hint} ${styles.hintKeys}`}>{t("hintKeys")}</span>
        {edgeText ? (
          <span className={styles.edge} aria-hidden="true">
            {`${edgeText} · ${String(frame.position).padStart(2, "0")}`}
          </span>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
