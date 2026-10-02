"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { formatRollDate } from "@/features/rolls/format-date";
import { RollUploadSection } from "@/features/uploads/components/RollUploadSection";
import { getScanSetForRollAction } from "../actions";
import type { IScanSetSummary } from "../core";
import { ScanSetForm } from "./ScanSetForm";
import styles from "./RollScans.module.css";

export interface RollScansProps {
  rollId: string;
  rollLabel: string;
  frameCount: number;
  /** The roll's computed push/pull, in thirds (D8). */
  rollPushPullThirds: number | null;
  /** The roll's scan set, or null before the first upload. */
  scanSet: IScanSetSummary | null;
  initialOpenUpload?: boolean;
}

/**
 * The roll page's scans block: upload (F1), the scan-set line with its "Chưa chọn lab" prompt,
 * and the scan-set form (F2, LAB-3). The form opens on the scan set the first upload created,
 * so it's re-read when opened rather than trusted from the page render.
 */
export function RollScans({ rollId, rollLabel, frameCount, rollPushPullThirds, scanSet, initialOpenUpload }: RollScansProps) {
  const t = useTranslations("scanSets");
  const router = useRouter();
  const [editing, setEditing] = useState<IScanSetSummary | null>(null);

  const openForm = async () => {
    const current = await getScanSetForRollAction(rollId);
    if (current) setEditing(current);
  };

  const labParts = scanSet?.labName ? [scanSet.labName, scanSet.branchName].filter(Boolean).join(" · ") : null;
  const received = scanSet?.receivedAt ? formatRollDate(scanSet.receivedAt, "day") : null;

  return (
    <div className={styles.scans}>
      {scanSet ? (
        <button type="button" className={labParts ? styles.line : styles.ask} onClick={openForm}>
          {labParts ? (received ? t("line", { lab: labParts, date: received }) : t("lineNoDate", { lab: labParts })) : t("askLab")}
        </button>
      ) : null}

      <RollUploadSection
        rollId={rollId}
        rollLabel={rollLabel}
        frameCount={frameCount}
        onOpenScanSet={openForm}
        initialOpen={initialOpenUpload}
      />

      <ResponsiveDialog open={editing !== null} onClose={() => setEditing(null)} labelledBy="scan-set-form-title">
        {editing ? (
          <ScanSetForm
            scanSet={editing}
            rollLabel={rollLabel}
            rollPushPullThirds={rollPushPullThirds}
            onSaved={() => {
              setEditing(null);
              router.refresh();
            }}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
