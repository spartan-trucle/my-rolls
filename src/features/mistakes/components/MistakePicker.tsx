"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MISTAKE_TYPES, type TMistakeType } from "../types";
import { setMistakesAction } from "../actions";
import type { IRollMistake } from "../core";
import styles from "./MistakePicker.module.css";

interface ISingleMistakePickerProps {
  bulk?: undefined;
  rollId: string;
  /** The frame the picker opened on; `null` opens it on the whole roll. */
  frameId: string | null;
  framePosition: number | null;
  /** The roll's live mistakes (frame-level and roll-level). */
  mistakes: IRollMistake[];
  onDone: () => void;
}

/** A frame the bulk picker adds mistakes to, for its thumbnails and numbers. */
export interface IBulkPickerFrame {
  id: string;
  position: number;
  gridUrl: string;
  isBlank: boolean;
}

export type TMistakeItem = { type: TMistakeType; note?: string };

interface IBulkMistakePickerProps {
  /** COL-4 "N tấm" mode (D13): adds the picked types to every frame through `onSubmit`, which saves them. */
  bulk: {
    frames: IBulkPickerFrame[];
    /** Resolves `{ ok: false }` or throws when the save failed; the picker stays open and says so. */
    onSubmit: (items: TMistakeItem[]) => Promise<{ ok: boolean }>;
    onCancel: () => void;
  };
}

export type MistakePickerProps = ISingleMistakePickerProps | IBulkMistakePickerProps;

/** The `MistakePicker` board (NOTE-2), or the `MistakePickerBulk` board when given `bulk` frames. */
export function MistakePicker(props: MistakePickerProps) {
  return props.bulk ? <BulkMistakePicker {...props.bulk} /> : <SingleMistakePicker {...props} />;
}

/** The `MistakePicker` board (NOTE-2): several types for this frame or the whole roll, a note each. */
function SingleMistakePicker({ rollId, frameId, framePosition, mistakes, onDone }: ISingleMistakePickerProps) {
  const t = useTranslations("mistakes");
  const [scope, setScope] = useState<"frame" | "roll">(frameId ? "frame" : "roll");
  const scopeFrameId = scope === "frame" ? frameId : null;
  const current = (id: string | null) => mistakes.filter((m) => m.frameId === id);
  const initial = (id: string | null) => new Map(current(id).map((m) => [m.type, m.note ?? ""]));
  const [chosen, setChosen] = useState<Map<TMistakeType, string>>(initial(scopeFrameId));
  const [error, setError] = useState<string | null>(null);

  const switchScope = (next: "frame" | "roll") => {
    setScope(next);
    setChosen(initial(next === "frame" ? frameId : null));
  };

  const flip = (type: TMistakeType) => {
    const next = new Map(chosen);
    if (next.has(type)) next.delete(type);
    else next.set(type, "");
    setChosen(next);
  };

  const submit = async (items: Array<{ type: TMistakeType; note?: string }>) => {
    setError(null);
    const result = await setMistakesAction({ rollId, frameId: scopeFrameId, items }).catch(() => ({ ok: false }));
    if (result.ok) onDone();
    else setError(t("saveFailed"));
  };

  const ordered = MISTAKE_TYPES.filter((type) => chosen.has(type));
  const title = t("title", { scope: scope === "frame" && framePosition != null ? t("frameScope", { n: framePosition }) : t("scopeRoll") });

  return (
    <div className={styles.picker}>
      <h2 id="mistake-picker-title" className={styles.title}>
        {title}
      </h2>

      {frameId ? (
        <div className={styles.scope} role="group" aria-label={t("scopeGroup")}>
          <button type="button" aria-pressed={scope === "frame"} onClick={() => switchScope("frame")}>
            {t("scopeFrame")}
          </button>
          <button type="button" aria-pressed={scope === "roll"} onClick={() => switchScope("roll")}>
            {t("scopeRoll")}
          </button>
        </div>
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("legend")}</legend>
        <div className={styles.chips}>
          {MISTAKE_TYPES.map((type) => (
            <label key={type} className={styles.chip}>
              <input type="checkbox" className={styles.sr} checked={chosen.has(type)} onChange={() => flip(type)} />
              <span>{t(`types.${type}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {ordered.map((type) => (
        <div key={type} className={styles.field}>
          <label className={styles.legend} htmlFor={`mistake-note-${type}`}>
            {t("noteLabel", { type: t(`types.${type}`) })}
          </label>
          <input
            id={`mistake-note-${type}`}
            className={styles.input}
            placeholder={t("notePlaceholder")}
            value={chosen.get(type) ?? ""}
            onChange={(e) => setChosen(new Map(chosen).set(type, e.target.value))}
          />
        </div>
      ))}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => void submit(ordered.map((type) => ({ type, note: chosen.get(type)?.trim() || undefined })))}
        >
          {t("save")}
        </button>
        <button type="button" className={styles.clear} onClick={() => void submit([])}>
          {t("clear")}
        </button>
      </div>
    </div>
  );
}

const THUMBS = 5;

/** The `MistakePickerBulk` boards (D13): no frame/roll switch, nothing picked to start, types are added and existing ones stay. */
function BulkMistakePicker({ frames, onSubmit, onCancel }: IBulkMistakePickerProps["bulk"]) {
  const t = useTranslations("mistakes");
  const tSel = useTranslations("selection");
  const count = frames.length;
  const [chosen, setChosen] = useState<Map<TMistakeType, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flip = (type: TMistakeType) => {
    const next = new Map(chosen);
    if (next.has(type)) next.delete(type);
    else next.set(type, "");
    setChosen(next);
  };

  const ordered = MISTAKE_TYPES.filter((type) => chosen.has(type));

  const save = async () => {
    if (saving || ordered.length === 0) return;
    setSaving(true);
    setError(null);
    const items = ordered.map((type): TMistakeItem => {
      const note = chosen.get(type)?.trim();
      return note ? { type, note } : { type };
    });
    try {
      const result = await onSubmit(items);
      if (!result.ok) setError(t("saveFailed"));
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.head}>
        <h2 id="mistake-picker-title" className={styles.title}>
          {tSel("oopsFor", { count })}
        </h2>
        <button type="button" className={styles.close} aria-label={t("close")} onClick={onCancel}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className={styles.frames}>
        <div className={styles.thumbs} aria-hidden="true">
          {frames.slice(0, THUMBS).map((f) =>
            f.isBlank ? (
              <span key={f.id} className={styles.thumbBlank} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- R2 public grid copies, as in FrameGrid
              <img key={f.id} className={styles.thumb} src={f.gridUrl} alt="" draggable={false} />
            ),
          )}
          {count > THUMBS ? <span className={styles.more}>+{count - THUMBS}</span> : null}
        </div>
        <span className={styles.positions}>{tSel("bulkPositions", { list: frames.map((f) => f.position).join(" · ") })}</span>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t("legend")}</legend>
        <div className={styles.chips}>
          {MISTAKE_TYPES.map((type) => (
            <label key={type} className={styles.softChip}>
              <input type="checkbox" className={styles.sr} checked={chosen.has(type)} onChange={() => flip(type)} />
              <span>{t(`types.${type}`)}</span>
              <span className={styles.chipTick} aria-hidden="true">
                ✓
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {ordered.map((type) => (
        <div key={type} className={styles.field}>
          <label className={styles.legend} htmlFor={`mistake-note-${type}`}>
            {t("noteLabel", { type: t(`types.${type}`) })}
          </label>
          <input
            id={`mistake-note-${type}`}
            className={styles.input}
            placeholder={tSel("bulkNotePlaceholder", { count })}
            value={chosen.get(type) ?? ""}
            onChange={(e) => setChosen(new Map(chosen).set(type, e.target.value))}
          />
        </div>
      ))}

      <p className={styles.info}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
        <span>{tSel("bulkInfo", { count })}</span>
      </p>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.bulkActions}>
        <button type="button" className={styles.primary} onClick={() => void save()} disabled={saving || ordered.length === 0}>
          {tSel("bulkSave", { count })}
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          {tSel("cancel")}
        </button>
      </div>
    </div>
  );
}
