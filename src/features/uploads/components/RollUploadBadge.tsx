"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "@/design-system";
import { useUploads } from "../client/UploadProvider";
import { summarizeBatch } from "./format";

/** The roll card's stamp on home: upload progress, then failures, then the frame count (HomeUploading board). */
export function RollUploadBadge({ rollId, frameCount }: { rollId: string; frameCount: number }) {
  const t = useTranslations("uploads");
  const { batches } = useUploads();
  const batch = [...batches].reverse().find((b) => b.rollId === rollId);
  const s = batch ? summarizeBatch(batch) : null;

  if (s && s.total > 0 && !s.finished) {
    return (
      <Stamp tone="ink" icon="upload" label={t("badgeUploadingLabel", { done: s.done, total: s.total })}>
        {t("badgeUploading", { done: s.done, total: s.total })}
      </Stamp>
    );
  }
  if (s && s.failed > 0) {
    return (
      <Stamp tone="oops" icon="oops" label={t("badgeFailedLabel", { count: s.failed })}>
        {t("badgeFailed", { count: s.failed })}
      </Stamp>
    );
  }
  const count = Math.max(frameCount, s?.done ?? 0);
  return count > 0 ? <Stamp tone="ink">{t("badgeFrames", { count })}</Stamp> : null;
}
