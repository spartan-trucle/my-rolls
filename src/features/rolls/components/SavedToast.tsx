"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./SavedToast.module.css";

/** How long the toast stays before it goes away on its own. */
const DISMISS_AFTER_MS = 6000;

export interface SavedToastProps {
  title: string;
  body: string;
  editHref: string;
  editLabel: string;
  closeLabel: string;
}

/**
 * R1 (owner 30.09.2026, `RollSaved` board comment): "Đã lên kệ." is a toast
 * over the page, not a static section in it. It hides itself after a few
 * seconds or from its ✕, and drops `?saved=1` from the address on mount so
 * a reload or a shared link never brings it back.
 */
export function SavedToast({ title, body, editHref, editLabel, closeLabel }: SavedToastProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("saved")) {
      url.searchParams.delete("saved");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    const timer = window.setTimeout(() => setOpen(false), DISMISS_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div className={styles.toast} role="status">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.tick}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      <span className={styles.text}>
        <b>{title}</b> {body}
      </span>
      <Link href={editHref} className={styles.action}>
        {editLabel}
      </Link>
      <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label={closeLabel}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
