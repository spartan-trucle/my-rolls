"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { saveNoteAction } from "../actions";
import type { IRollNote } from "../core";
import { formatNoteDate } from "./format";
import styles from "./FrameNotes.module.css";

/** FrameView's "Ghi chú tấm này" (NOTE-1): this frame's notes and a quick add. */
export function FrameNotes({ rollId, frameId, notes: initial }: { rollId: string; frameId: string; notes: IRollNote[] }) {
  const t = useTranslations("notes");
  const [notes, setNotes] = useState(initial);
  const [draft, setDraft] = useState("");

  const add = async () => {
    const body = draft.trim();
    if (!body) return;
    const result = await saveNoteAction({ rollId, frameId, body }).catch(() => ({ ok: false as const }));
    if (!result.ok) return;
    const now = new Date();
    setNotes([{ id: result.id, body, frameId, framePosition: null, createdAt: now, updatedAt: now }, ...notes]);
    setDraft("");
  };

  return (
    <section aria-labelledby="frame-notes-heading" className={styles.section}>
      <h2 id="frame-notes-heading" className={styles.heading}>
        {t("frameNotesHeading")}
      </h2>
      {notes.map((n) => (
        <div key={n.id} className={styles.note}>
          <p className={styles.text}>{n.body}</p>
          <span className={styles.when}>{formatNoteDate(n.createdAt)}</span>
        </div>
      ))}
      <input
        className={styles.input}
        placeholder={t("frameNotePlaceholder")}
        aria-label={t("frameNotePlaceholder")}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void add();
        }}
        onBlur={() => void add()}
      />
    </section>
  );
}
