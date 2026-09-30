import type { IUploadBatch } from "../client/queue";

const MB = 1024 * 1024;

/** "24,3 MB" / "500 KB": Vietnamese decimal comma, as the UploadErrors board writes sizes. */
export function formatBytesVi(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export interface IBatchSummary {
  done: number;
  moving: number;
  waiting: number;
  failed: number;
  rejected: number;
  /** Files accepted for upload (rejected ones never count). */
  total: number;
  finished: boolean;
}

export function summarizeBatch(batch: IUploadBatch): IBatchSummary {
  const by = (s: string[]) => batch.files.filter((f) => s.includes(f.status)).length;
  const done = by(["done"]);
  const moving = by(["copies", "uploading", "confirming"]);
  const waiting = by(["queued"]);
  const failed = by(["failed"]);
  const rejected = by(["rejected"]);
  return { done, moving, waiting, failed, rejected, total: batch.files.length - rejected, finished: moving + waiting === 0 };
}
