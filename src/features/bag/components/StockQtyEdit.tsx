"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon } from "@/design-system";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { removeFromBag, setStockQty } from "@/features/bag/actions";
import styles from "./StockQtyEdit.module.css";

export interface StockQtyEditProps {
  bagItemId: string;
  /** `null` means "not counted yet" (BAG-2): no badge, and the dialog starts at 0. */
  qty: number | null;
  /** Fires once a save commits. `0` means the film left the bag (the server soft-deletes it). */
  onChange: (qty: number) => void;
  /** Fires once "Xoá khỏi túi" in the dialog removed the film from the bag. */
  onRemove: () => void;
  stockName: string;
}

/**
 * BAG-2 (owner 28.09.2026): the film row shows its count as a `×N` badge
 * and a pencil button; the − / count / + stepper lives in a dialog and
 * only commits on "Lưu". Saving 0 takes the film out of the bag, and so
 * does the dialog's "Xoá khỏi túi" — the film row has no × of its own.
 * Opening the dialog is already the deliberate step, so removing from it
 * doesn't ask a second time.
 */
export function StockQtyEdit({ bagItemId, qty, onChange, onRemove, stockName }: StockQtyEditProps) {
  const t = useTranslations("bag");
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(qty ?? 0);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  function openDialog() {
    setDraft(qty ?? 0);
    setFailed(false);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const result = await setStockQty({ bagItemId, qty: draft });
    setSaving(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setOpen(false);
    onChange(result.qty ?? 0);
  }

  async function remove() {
    setSaving(true);
    const result = await removeFromBag({ bagItemId });
    setSaving(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setOpen(false);
    onRemove();
  }

  return (
    <div className={styles.root}>
      {qty != null && qty > 0 ? <span className={styles.badge}>{t("qtyBadge", { count: qty })}</span> : null}
      <button type="button" className={styles.editButton} onClick={openDialog} aria-label={t("qtyEdit", { name: stockName })}>
        <Icon name="note" size={18} />
      </button>

      <ResponsiveDialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} size="compact">
        {open ? (
          <div className={styles.dialog}>
            <h2 id={titleId} className={styles.title}>
              {t("qtyDialogTitle", { name: stockName })}
            </h2>
            <div className={styles.stepper} role="group" aria-label={t("qtyGroupLabel", { name: stockName })}>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => setDraft((value) => Math.max(0, value - 1))}
                disabled={saving || draft <= 0}
                aria-label={t("qtyDecrement", { name: stockName })}
              >
                −
              </button>
              <span className={styles.count} aria-live="polite">
                {draft}
              </span>
              <button
                type="button"
                className={styles.stepButton}
                onClick={() => setDraft((value) => value + 1)}
                disabled={saving}
                aria-label={t("qtyIncrement", { name: stockName })}
              >
                +
              </button>
            </div>
            {draft === 0 ? <p className={styles.hint}>{t("qtyZeroHint")}</p> : null}
            {failed ? (
              <p className={styles.error} role="alert">
                {t("qtySaveFailed")}
              </p>
            ) : null}
            <div className={styles.actions}>
              <button type="button" className={styles.remove} onClick={remove} disabled={saving}>
                {t("removeConfirmConfirm")}
              </button>
              <Button onClick={() => setOpen(false)} disabled={saving}>
                {t("qtyCancel")}
              </Button>
              <Button variant="primary" onClick={save} disabled={saving}>
                {t("qtySave")}
              </Button>
            </div>
          </div>
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
