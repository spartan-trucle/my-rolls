"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setStockExpiryYear } from "@/features/bag/actions";
import styles from "./ExpiryYearField.module.css";

export interface ExpiryYearFieldProps {
  bagItemId: string;
  expiryYear: number | null;
  onChange: (expiryYear: number | null) => void;
}

/**
 * BAG-2 (R2-2, audit B1/E2): a small per-row control for expired film's
 * expiry year. Closed state is a chip ("+ Hạn dùng" or "Hết hạn {year}");
 * open state is a plain number input with Save/Clear, calling
 * `setStockExpiryYear`. No optimistic update here (unlike the qty
 * stepper) — it's edited rarely enough that waiting for the server
 * before closing is simpler and just as fast in practice.
 */
export function ExpiryYearField({ bagItemId, expiryYear, onChange }: ExpiryYearFieldProps) {
  const t = useTranslations("bag");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => String(expiryYear ?? ""));
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    const parsed = draft.trim() === "" ? null : Number(draft);
    if (parsed !== null && !Number.isInteger(parsed)) return;

    setSubmitting(true);
    const result = await setStockExpiryYear({ bagItemId, expiryYear: parsed });
    setSubmitting(false);

    if (result.ok) {
      onChange(result.expiryYear);
      setEditing(false);
    }
  }

  async function clear() {
    setSubmitting(true);
    const result = await setStockExpiryYear({ bagItemId, expiryYear: null });
    setSubmitting(false);

    if (result.ok) {
      onChange(null);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button type="button" className={styles.chip} onClick={() => setEditing(true)}>
        {expiryYear != null ? t("expirySet", { year: expiryYear }) : t("expiryAdd")}
      </button>
    );
  }

  return (
    <div className={styles.editor}>
      <label className={styles.editorLabel}>
        {t("expiryLabel")}
        <input
          type="number"
          inputMode="numeric"
          className={styles.editorInput}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={submitting}
        />
      </label>
      <button type="button" className={styles.editorSave} onClick={save} disabled={submitting}>
        {t("expirySave")}
      </button>
      {expiryYear != null ? (
        <button type="button" className={styles.editorClear} onClick={clear} disabled={submitting}>
          {t("expiryClear")}
        </button>
      ) : null}
      <button type="button" className={styles.editorCancel} onClick={() => setEditing(false)} disabled={submitting}>
        {t("expiryCancel")}
      </button>
    </div>
  );
}
