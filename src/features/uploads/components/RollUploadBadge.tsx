"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Stamp } from "@/design-system";
import { useUploads } from "../client/UploadProvider";
import { summarizeBatch } from "./format";

/**
 * A roll's scan status on the shelf: upload progress, then failures
 * (HomeUploading board's stamps), then the frame count as plain mono text,
 * else `waiting` (the `Shelf` board's "Chờ scan").
 */
export function RollUploadBadge({ rollId, frameCount, waiting = null }: { rollId: string; frameCount: number; waiting?: ReactNode }) {
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
  if (count === 0) return waiting;
  return <span className="font-mono text-label font-normal uppercase tracking-normal text-ink-muted tabular-nums">{t("badgeFrames", { count })}</span>;
}
