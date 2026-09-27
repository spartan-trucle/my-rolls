"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setStockQty } from "@/features/bag/actions";
import styles from "./StockQtyStepper.module.css";

export interface StockQtyStepperProps {
  bagItemId: string;
  /** `null` means "not counted yet" (BAG-2), shown and stepped from as 0. */
  qty: number | null;
  /** Fires once a step commits successfully, so the caller's `entries` stay in sync. */
  onChange: (qty: number) => void;
  stockName: string;
}

/**
 * BAG-2 (R2-2, audit B2): the film pocket's − / count / + stepper.
 * Optimistic — the shown count moves immediately, `setStockQty` fires in
 * the background, and a failed call reverts the display and leaves
 * `entries` untouched (the caller only hears about a *committed* change,
 * via `onChange`). "Hết" is a caption under the stepper rather than
 * swapping the "−" for a remove icon — removing the bag item stays the
 * item row's own ✕ + confirm dialog (task brief: "✕ removes with the
 * existing confirm").
 */
export function StockQtyStepper({ bagItemId, qty, onChange, stockName }: StockQtyStepperProps) {
  const t = useTranslations("bag");
  const [displayQty, setDisplayQty] = useState(qty ?? 0);
  const [pending, setPending] = useState(false);

  async function step(delta: 1 | -1) {
    if (pending) return;

    const previous = displayQty;
    const next = Math.max(0, previous + delta);
    if (next === previous) return;

    setDisplayQty(next);
    setPending(true);
    const result = await setStockQty({ bagItemId, qty: next });
    setPending(false);

    if (result.ok) {
      onChange(result.qty ?? 0);
    } else {
      setDisplayQty(previous); // revert: the server didn't accept the step
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.stepper} role="group" aria-label={t("qtyGroupLabel", { name: stockName })}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => step(-1)}
          disabled={pending || displayQty <= 0}
          aria-label={t("qtyDecrement", { name: stockName })}
        >
          −
        </button>
        <span className={styles.count} aria-live="polite">
          {displayQty}
        </span>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => step(1)}
          disabled={pending}
          aria-label={t("qtyIncrement", { name: stockName })}
        >
          +
        </button>
      </div>
      {displayQty === 0 ? <span className={styles.empty}>{t("qtyEmpty")}</span> : null}
    </div>
  );
}
