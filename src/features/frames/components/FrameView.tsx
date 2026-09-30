"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/design-system";
import { deleteFrameAction, moveFrameAction, restoreFrameAction, setFrameMarksAction } from "../actions";
import type { IRollFrame } from "../core";
import styles from "./FrameView.module.css";

const UNDO_MS = 5_000;

export interface FrameViewProps {
  rollId: string;
  rollLabel: string;
  frames: IRollFrame[];
  index: number;
  /** F4's mistake stamps and picker. */
  oopsSlot?: ReactNode;
  /** F4's notes for this frame. */
  notesSlot?: ReactNode;
}

/** The `FrameView` board (SCAN-3, SCAN-4, SCAN-2 reorder, D23): one frame, marks, move, delete. */
export function FrameView({ rollId, rollLabel, frames, index, oopsSlot, notesSlot }: FrameViewProps) {
  const t = useTranslations("frames");
  const router = useRouter();
  const frame = frames[index];
  const prev = frames[index - 1];
  const next = frames[index + 1];
  const href = (f: IRollFrame) => `/rolls/${rollId}/frames/${f.id}`;

  const [marks, setMarks] = useState({ isKeeper: frame.isKeeper, isBlank: frame.isBlank });
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState(String(frame.position));
  const [deleted, setDeleted] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowLeft" && prev) router.push(href(prev));
      if (e.key === "ArrowRight" && next) router.push(href(next));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const toggle = async (mark: "isKeeper" | "isBlank") => {
    const before = marks;
    const on = !marks[mark];
    // D3: blank and tấm ưng exclude each other.
    const after = mark === "isBlank" ? { isBlank: on, isKeeper: on ? false : marks.isKeeper } : { isKeeper: on, isBlank: on ? false : marks.isBlank };
    setMarks(after);
    setError(null);
    const result = await setFrameMarksAction({ frameId: frame.id, [mark]: on }).catch(() => ({ ok: false }));
    if (!result.ok) {
      setMarks(before);
      setError(t("saveFailed"));
    }
  };

  const move = async () => {
    const to = Number(target);
    if (!Number.isInteger(to) || to < 1) return;
    const result = await moveFrameAction({ frameId: frame.id, toPosition: to }).catch(() => ({ ok: false }));
    if (result.ok) {
      setMoving(false);
      router.refresh();
    } else setError(t("saveFailed"));
  };

  const remove = async () => {
    const result = await deleteFrameAction({ frameId: frame.id }).catch(() => ({ ok: false }));
    if (!result.ok) return setError(t("saveFailed"));
    setDeleted(true);
    undoTimer.current = setTimeout(() => router.push(next ? href(next) : prev ? href(prev) : `/rolls/${rollId}`), UNDO_MS);
  };

  const undo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    const result = await restoreFrameAction({ frameId: frame.id }).catch(() => ({ ok: false }));
    if (result.ok) setDeleted(false);
    else setError(t("saveFailed"));
  };

  return (
    <div className={styles.view}>
      <div className={styles.top}>
        <Link href={`/rolls/${rollId}`} className={styles.back}>
          {t("back", { roll: rollLabel })}
        </Link>
        <span className={styles.pos}>{t("position", { n: frame.position, total: frames.length })}</span>
      </div>

      <div className={styles.stage}>
        {marks.isBlank ? (
          <div className={styles.blankTile} role="img" aria-label={t("blank")}>
            {t("blankTile")}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- the browser-made 2048 px copy on R2 (D11)
          <img className={styles.photo} src={frame.viewUrl} alt={t("frameLabel", { n: frame.position })} width={frame.width ?? undefined} height={frame.height ?? undefined} />
        )}
      </div>

      <div className={styles.nav}>
        {prev ? (
          <Link href={href(prev)} className={styles.navBtn} aria-label={t("prev")}>
            ‹
          </Link>
        ) : (
          <span className={styles.navBtn} aria-hidden="true" />
        )}
        <span className={styles.edge}>{frame.position}</span>
        {next ? (
          <Link href={href(next)} className={styles.navBtn} aria-label={t("next")}>
            ›
          </Link>
        ) : (
          <span className={styles.navBtn} aria-hidden="true" />
        )}
      </div>

      <div className={styles.panel}>
        <div className={styles.toggles}>
          <button type="button" className={styles.toggle} aria-pressed={marks.isKeeper} onClick={() => toggle("isKeeper")}>
            <Icon name="keeper" size={18} /> {t("keeper")}
          </button>
          <button type="button" className={styles.toggle} aria-pressed={marks.isBlank} onClick={() => toggle("isBlank")}>
            {t("blank")}
          </button>
          {oopsSlot}
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {notesSlot}

        <div className={styles.tools}>
          <a className={styles.tool} href={`/api/frames/${frame.id}/original`} target="_blank" rel="noopener">
            {t("original")}
          </a>
          <button type="button" className={styles.tool} aria-expanded={moving} onClick={() => setMoving(!moving)}>
            {t("move")}
          </button>
          <button type="button" className={styles.toolDanger} onClick={remove} disabled={deleted}>
            {t("delete")}
          </button>
        </div>

        {moving ? (
          <div className={styles.move}>
            <label className={styles.label} htmlFor="frame-move">
              {t("moveLabel")}
            </label>
            <input id="frame-move" className={styles.input} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />
            <button type="button" className={styles.tool} onClick={move}>
              {t("moveGo")}
            </button>
          </div>
        ) : null}

        {deleted ? (
          <div className={styles.undo} role="status">
            <span>{t("deleted", { n: frame.position })}</span>
            <button type="button" className={styles.tool} onClick={undo}>
              {t("undo")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
