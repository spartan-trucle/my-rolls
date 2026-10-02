"use client";

import { useTranslations } from "next-intl";
import { Button, cx } from "@/design-system";
import styles from "./SelectionBar.module.css";

export interface SelectionBarProps {
  /** Frames picked; 0 keeps only the (empty) live region, so the first count is announced. */
  count: number;
  onKeeper(): void;
  onOops(): void;
  onBlank(): void;
  onClear(): void;
  /** R22: a bulk save is in flight; every button is off. */
  busy: boolean;
  error: string | null;
  /** D12: every picked frame already has this mark, so the button removes it. */
  pressed?: { keeper: boolean; blank: boolean };
}

/** COL-4's bar (RollGrid / RollGridWeb): docked at the bottom on phones, beside the filter chips on desktop. */
export function SelectionBar({ count, onKeeper, onOops, onBlank, onClear, busy, error, pressed }: SelectionBarProps) {
  const t = useTranslations("selection");
  const active = count > 0;
  return (
    <div className={cx(styles.bar, !active && styles.idle)} role="group" aria-label={t("bar")} aria-busy={busy || undefined}>
      <p className={styles.count} role="status" aria-live="polite">
        {active ? t("count", { count }) : ""}
      </p>
      {active ? (
        <>
          <Button variant="primary" size="sm" icon="keeper" className={cx(styles.action, styles.keeper)} onClick={onKeeper} disabled={busy} aria-pressed={pressed ? pressed.keeper : undefined}>
            {t("keeper")}
          </Button>
          <Button variant="outline" size="sm" icon="oops" className={cx(styles.action, styles.oops)} onClick={onOops} disabled={busy}>
            {t("oops")}
          </Button>
          <Button variant="outline" size="sm" className={cx(styles.action, styles.blank)} onClick={onBlank} disabled={busy} aria-pressed={pressed ? pressed.blank : undefined}>
            {t("blank")}
          </Button>
          <Button variant="quiet" size="sm" className={cx(styles.action, styles.clear)} onClick={onClear} disabled={busy}>
            {t("clear")}
          </Button>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
