"use client";

import { useTranslations } from "next-intl";
import { cx } from "@/design-system/cx";
import styles from "./DialogCloseButton.module.css";

export interface DialogCloseButtonProps {
  onClose: () => void;
  className?: string;
}

/**
 * The board's `.xbtn` (`CatalogueSearch(Web)`, `CustomEntry(Web)`): an "X"
 * next to the dialog's own heading, sized to sit in the same flex row as
 * the title with a small negative margin so it lines up with the row's
 * edge rather than the row's own padding. No `IconName` in the design
 * system covers an X, so this draws the same inline path the boards use.
 */
export function DialogCloseButton({ onClose, className }: DialogCloseButtonProps) {
  const t = useTranslations("common");

  return (
    <button type="button" className={cx(styles.close, className)} aria-label={t("close")} onClick={onClose}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
