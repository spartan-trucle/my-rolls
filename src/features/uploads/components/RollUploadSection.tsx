"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { UploadDrop } from "@/design-system";
import { ALLOWED_UPLOAD_TYPES } from "../limits";
import { collectDroppedFiles } from "../client/drop";
import { useUploads } from "../client/UploadProvider";
import { UploadList } from "./UploadList";
import styles from "./RollUploadSection.module.css";

export interface RollUploadSectionProps {
  rollId: string;
  /** "Cuộn #16". */
  rollLabel: string;
  /** Ready frames already on the roll; new files are numbered after them. */
  frameCount: number;
  /** Opens the scan-set form (F2). The list's lab row is hidden without it. */
  onOpenScanSet?: () => void;
  /** The tray links here with `?upload=1` to reopen the list. */
  initialOpen?: boolean;
}

/** The roll page's drop zone and upload list (SCAN-1, SCAN-2; `RollSaved` and `UploadScans` boards). */
export function RollUploadSection({ rollId, rollLabel, frameCount, onOpenScanSet, initialOpen = false }: RollUploadSectionProps) {
  const t = useTranslations("uploads");
  const { batches, start, retry, retryAll } = useUploads();
  const [open, setOpen] = useState(initialOpen);
  const batch = [...batches].reverse().find((b) => b.rollId === rollId) ?? null;

  const onFiles = (files: File[]) => {
    start(rollId, files, frameCount + 1, rollLabel);
    setOpen(true);
  };

  return (
    <div className={styles.section}>
      <UploadDrop
        title={t("dropTitle")}
        hint={t("dropHint")}
        accept={ALLOWED_UPLOAD_TYPES.join(",")}
        readDrop={collectDroppedFiles}
        onFiles={onFiles}
      />
      <ResponsiveDialog open={open && batch !== null} onClose={() => setOpen(false)} labelledBy="upload-list-title">
        {batch ? (
          <div className={styles.sheet}>
            <UploadList
              batch={batch}
              title={t("sheetTitle", { roll: rollLabel })}
              onRetry={retry}
              onRetryAll={retryAll}
              onOpenScanSet={onOpenScanSet}
              onMinimize={() => setOpen(false)}
              offline={typeof navigator !== "undefined" && navigator.onLine === false}
            />
          </div>
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
