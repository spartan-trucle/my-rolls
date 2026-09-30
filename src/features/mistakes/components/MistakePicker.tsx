"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MISTAKE_TYPES, type TMistakeType } from "../types";
import { setMistakesAction } from "../actions";
import type { IRollMistake } from "../core";
import styles from "./MistakePicker.module.css";

export interface MistakePickerProps {
  rollId: string;
  /** The frame the picker opened on; `null` opens it on the whole roll. */
  frameId: string | null;
  framePosition: number | null;
  /** The roll's live mistakes (frame-level and roll-level). */
  mistakes: IRollMistake[];
  onDone: () => void;
}

/** The `MistakePicker` board (NOTE-2): several types for this frame or the whole roll, a note each. */
export function MistakePicker({ rollId, frameId, framePosition, mistakes, onDone }: MistakePickerProps) {
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
