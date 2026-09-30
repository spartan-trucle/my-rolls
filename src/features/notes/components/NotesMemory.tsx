"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { deleteNoteAction, saveMemoryAction, saveNoteAction } from "../actions";
import type { IRollNote } from "../core";
import { formatNoteDate, formatSavedTime } from "./format";
import { useAutosave } from "./useAutosave";
import styles from "./NotesMemory.module.css";

export interface NotesMemoryProps {
  rollId: string;
  rollTitle: string;
  memory: string | null;
  notes: IRollNote[];
}

function SaveState({ state, savedAt, onRetry }: { state: string; savedAt: Date | null; onRetry: () => void }) {
  const t = useTranslations("notes");
  if (state === "saving") return <span className={styles.state}>{t("saving")}</span>;
  if (state === "saved" && savedAt) return <span className={styles.state}>{t("savedAt", { time: formatSavedTime(savedAt) })}</span>;
  if (state === "error")
    return (
      <button type="button" className={styles.stateError} onClick={onRetry}>
        {t("failed")}
      </button>
    );
  return null;
}

function NoteRow({ rollId, note, onDeleted }: { rollId: string; note: IRollNote; onDeleted: (id: string) => void }) {
  const t = useTranslations("notes");
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  // Review #14: an emptied note isn't saved (the server would delete it); the ✕ button deletes.
  const autosave = useAutosave((value) => saveNoteAction({ noteId: note.id, rollId, body: value }), {
    skip: (value) => value.trim() === "",
  });

  return (
    <div className={styles.note}>
      <div className={styles.noteMain}>
        <span className={styles.when}>{formatNoteDate(note.createdAt)}</span>
        {editing ? (
          <textarea
            className={styles.noteEdit}
            aria-label={t("editLabel")}
            value={body}
            autoFocus
            onChange={(e) => {
              setBody(e.target.value);
              autosave.change(e.target.value);
            }}
            onBlur={() => {
              void autosave.flush();
              setEditing(false);
            }}
          />
        ) : (
          <p className={styles.noteText}>{body}</p>
        )}
        {note.frameId && note.framePosition != null ? (
          <Link className={styles.frameLink} href={`/rolls/${rollId}/frames/${note.frameId}`}>
            {t("frameLink", { n: note.framePosition })}
          </Link>
        ) : null}
        <SaveState state={autosave.state} savedAt={autosave.savedAt} onRetry={() => void autosave.retry()} />
      </div>
      <div className={styles.noteActions}>
        <button type="button" className={styles.iconBtn} aria-label={t("edit", { text: body })} onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label={t("delete", { text: body })}
          onClick={async () => {
            const result = await deleteNoteAction({ noteId: note.id }).catch(() => ({ ok: false }));
            if (result.ok) onDeleted(note.id);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** The `NotesMemory` board (NOTE-1): the roll's memory, autosaved, and its timestamped notes. */
export function NotesMemory({ rollId, rollTitle, memory, notes: initialNotes }: NotesMemoryProps) {
  const t = useTranslations("notes");
  const [memo, setMemo] = useState(memory ?? "");
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const autosave = useAutosave((value) => saveMemoryAction({ rollId, memory: value }));

  const add = async () => {
    const body = draft.trim();
    if (!body) return;
    const result = await saveNoteAction({ rollId, body }).catch(() => ({ ok: false as const }));
    if (!result.ok) return;
    const now = new Date();
    setNotes([{ id: result.id, body, frameId: null, framePosition: null, createdAt: now, updatedAt: now }, ...notes]);
    setDraft("");
  };

  return (
    <div className={styles.page}>
      <Link href={`/rolls/${rollId}`} className={styles.back}>
        {t("back", { roll: rollTitle })}
      </Link>
      <h1 className={styles.title}>{t("pageTitle")}</h1>

      <section aria-labelledby="memory-heading" className={styles.section}>
        <div className={styles.head}>
          <h2 id="memory-heading" className={styles.heading}>
            {t("memoryHeading")}
          </h2>
          <span aria-live="polite">
            <SaveState state={autosave.state} savedAt={autosave.savedAt} onRetry={() => void autosave.retry()} />
          </span>
        </div>
        <label className={styles.label} htmlFor="roll-memory">
          {t("memoryLabel")}
        </label>
        <textarea
          id="roll-memory"
          className={styles.memo}
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            autosave.change(e.target.value);
          }}
          onBlur={() => void autosave.flush()}
        />
        <span className={styles.hint}>{t("memoryHint")}</span>
      </section>

      <section aria-labelledby="notes-heading" className={styles.section}>
        <h2 id="notes-heading" className={styles.heading}>
          {t("notesHeading", { count: notes.length })}
        </h2>
        {notes.map((n) => (
          <NoteRow key={n.id} rollId={rollId} note={n} onDeleted={(id) => setNotes((all) => all.filter((x) => x.id !== id))} />
        ))}
      </section>

      <div className={styles.composer}>
        <label className={styles.srOnly} htmlFor="new-note">
          {t("newLabel")}
        </label>
        <input
          id="new-note"
          className={styles.input}
          placeholder={t("newPlaceholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button type="button" className={styles.send} aria-label={t("add")} onClick={() => void add()}>
          ↵
        </button>
      </div>
    </div>
  );
}
