"use client";

import { useState, type DragEvent } from "react";
import { cx } from "@/design-system/cx";
import styles from "./UploadDrop.module.css";

export interface UploadDropProps {
  onFiles: (files: File[]) => void;
  title: string;
  /** e.g. accepted formats. */
  hint: string;
  /** Defaults to image/*. */
  accept?: string;
  /** Reads a drop itself, e.g. to walk a dropped folder (SCAN-2). Defaults to `dataTransfer.files`. */
  readDrop?: (dataTransfer: DataTransfer) => Promise<File[]>;
  className?: string;
}

export function UploadDrop({ onFiles, title, hint, accept = "image/*", readDrop, className }: UploadDropProps) {
  const [over, setOver] = useState(false);

  const take = (list: FileList | File[] | null | undefined) => {
    if (list && list.length > 0) onFiles(Array.from(list));
  };

  const onDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(true);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setOver(false);
    if (readDrop && e.dataTransfer) void readDrop(e.dataTransfer).then(take);
    else take(e.dataTransfer?.files);
  };

  return (
    <label className={cx(styles.drop, over && styles.over, className)} onDragOver={onDragOver} onDragLeave={() => setOver(false)} onDrop={onDrop}>
      <svg className={styles.glyph} viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x={14} y={16} width={22} height={32} rx={2} />
        <path d="M20 16v-5h10v5M36 26h8v14h-8M14 26h22M14 38h22" />
        <path d="M44 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </svg>
      <p className={styles.title}>{title}</p>
      <p className={styles.hint}>{hint}</p>
      <input className={styles.input} type="file" multiple accept={accept} onChange={(e) => take(e.target.files)} />
    </label>
  );
}
