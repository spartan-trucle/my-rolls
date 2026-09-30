"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/design-system";
import type { IUploadBatch } from "../client/queue";
import { summarizeBatch } from "./format";
import styles from "./UploadTray.module.css";

const HIDE_AFTER_MS = 5_000;

export interface UploadTrayProps {
  batch: IUploadBatch | null;
  /** "Cuộn #16". */
  rollLabel: string;
}

/** The `UploadTray` board: follows the user around the app while a batch runs (D16). */
export function UploadTray({ batch, rollLabel }: UploadTrayProps) {
  const t = useTranslations("uploads");
  const [hiddenBatch, setHiddenBatch] = useState<string | null>(null);
  const s = batch ? summarizeBatch(batch) : null;
  const clean = Boolean(s?.finished && s.failed === 0);

  useEffect(() => {
    if (!batch || !clean) return;
    const timer = setTimeout(() => setHiddenBatch(batch.id), HIDE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [batch, clean]);

  if (!batch || !s || s.total === 0 || hiddenBatch === batch.id) return null;
  const roll = rollLabel.toUpperCase();

  if (!s.finished) {
    return (
      <Link
        className={styles.tray}
        href={`/rolls/${batch.rollId}?upload=1`}
        aria-label={t("trayUploadingLabel", { done: s.done, total: s.total, roll: rollLabel })}
      >
        <span className={styles.icon}>
          <Icon name="upload" size={20} />
        </span>
        <span className={styles.body}>
          <span>
            {t("trayUploading", { done: s.done, total: s.total })} <span className={styles.meta}>· {roll}</span>
          </span>
          <span className={styles.bar}>
            <span style={{ width: `${(s.done / s.total) * 100}%` }} />
          </span>
        </span>
      </Link>
    );
  }

  if (s.failed > 0) {
    return (
      <Link className={styles.tray} href={`/rolls/${batch.rollId}?upload=1`}>
        <span className={`${styles.icon} ${styles.bad}`} aria-hidden="true">
          !
        </span>
        <span className={styles.body}>
          <span>
            {t("trayFailed", { done: s.done, total: s.total })} · <span className={styles.err}>{t("trayFailedCount", { count: s.failed })}</span>
          </span>
          <span className={styles.meta}>{t("trayFailedMeta", { roll })}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link className={styles.tray} href={`/rolls/${batch.rollId}`}>
      <span className={`${styles.icon} ${styles.ok}`} aria-hidden="true">
        ✓
      </span>
      <span className={styles.body}>
        <span>{t("trayDone", { done: s.done, total: s.total })}</span>
        <span className={styles.meta}>{t("trayDoneMeta", { roll })}</span>
      </span>
    </Link>
  );
}
