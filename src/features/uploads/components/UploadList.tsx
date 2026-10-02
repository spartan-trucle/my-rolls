"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/design-system";
import type { IUploadBatch, IUploadFile } from "../client/queue";
import { formatBytesVi, summarizeBatch } from "./format";
import styles from "./UploadList.module.css";

export interface UploadListProps {
  batch: IUploadBatch;
  /** "Tải scan · Cuộn #16". */
  title: string;
  titleId?: string;
  onRetry: (fileId: string) => void;
  onRetryAll: (batchId: string) => void;
  /** Opens the scan-set form; the lab row is hidden without it. */
  onOpenScanSet?: () => void;
  onMinimize: () => void;
  /** `navigator.onLine`, passed in so it can be tested. */
  offline?: boolean;
}

const WAITING_SHOWN = 3;
const DONE_SHOWN = 3;

function Thumb({ file }: { file: IUploadFile }) {
  // A blob: URL of the browser-made 480 px copy; next/image has nothing to optimise here.
  // eslint-disable-next-line @next/next/no-img-element
  return file.thumbUrl ? <img className={styles.thumb} src={file.thumbUrl} alt="" /> : <span className={styles.thumb} aria-hidden="true" />;
}

/** The `UploadScans` board: totals, lab prompt, and files grouped by what needs doing (SCAN-1, SCAN-2). */
export function UploadList({ batch, title, titleId = "upload-list-title", onRetry, onRetryAll, onOpenScanSet, onMinimize, offline }: UploadListProps) {
  const t = useTranslations("uploads");
  const s = summarizeBatch(batch);
  const failed = batch.files.filter((f) => f.status === "failed");
  const moving = batch.files.filter((f) => ["copies", "uploading", "confirming"].includes(f.status));
  const waiting = batch.files.filter((f) => f.status === "queued");
  const done = batch.files.filter((f) => f.status === "done");
  const tooBig = batch.files.filter((f) => f.error === "too_big");
  const wrongType = batch.files.filter((f) => f.error === "wrong_type");

  const stat = (f: IUploadFile) =>
    f.status === "copies"
      ? t("statCopies")
      : f.status === "confirming"
        ? t("statConfirming")
        : t("statUploading", { percent: Math.round(f.progress * 100) });

  return (
    <section className={styles.list} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>

      <p className={styles.totals}>
        {t("totals", { done: s.done, total: s.total, moving: s.moving, waiting: s.waiting })}
        {s.failed > 0 ? t("totalsFailed", { failed: s.failed }) : null}
      </p>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={s.total}
        aria-valuenow={s.done}
        aria-label={t("progressLabel", { done: s.done, total: s.total })}
      >
        <span style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%` }} />
      </div>

      {offline && !s.finished ? (
        <div className={styles.bannerBad} role="alert">
          <b>{t("offlineTitle")}</b> {t("offlineBody", { done: s.done, left: s.total - s.done })}
        </div>
      ) : null}

      {tooBig.length > 0 || wrongType.length > 0 ? (
        <div className={styles.rejected}>
          <div className={styles.bannerBad} role="alert">
            {tooBig.length > 0 ? (
              <>
                <b>{t("tooBigBanner", { count: tooBig.length })}</b> {t("tooBigBody")}
              </>
            ) : null}
            {wrongType.length > 0 ? <b>{t("wrongTypeBanner", { count: wrongType.length })}</b> : null}
          </div>
          {[...tooBig, ...wrongType].map((f) => (
            <div key={f.id} className={styles.row}>
              <span className={styles.thumbX}>{f.name.split(".").pop()?.toUpperCase()}</span>
              <span className={styles.name}>{f.name}</span>
              <span className={styles.errMeta}>{formatBytesVi(f.bytes)}</span>
            </div>
          ))}
          <p className={styles.hint}>{t("acceptHint")}</p>
        </div>
      ) : null}

      {onOpenScanSet ? (
      <button type="button" className={styles.labRow} onClick={onOpenScanSet}>
        <Icon name="film" size={20} />
        <span>
          <span className={styles.labTitle}>{t("labRowTitle")}</span>
          <span className={styles.labBody}>{t("labRowBody")}</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>
      ) : null}

      {failed.length > 0 ? (
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.errLabel}>{t("needsRetry", { count: failed.length })}</span>
            <button type="button" className={styles.link} onClick={() => onRetryAll(batch.id)}>
              {t("retryAll")}
            </button>
          </div>
          {failed.map((f) => (
            <div key={f.id} className={styles.row}>
              <Thumb file={f} />
              <span className={styles.stack}>
                <span className={styles.name}>{f.name}</span>
                <span className={styles.err}>{f.error ? t(`why.${f.error as "put"}`) : null}</span>
              </span>
              <button type="button" className={styles.link} onClick={() => onRetry(f.id)} aria-label={t("retryFile", { name: f.name })}>
                {t("retry")}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {moving.length > 0 ? (
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.label}>{t("moving")}</span>
          </div>
          {moving.map((f) => (
            <div key={f.id} className={styles.row}>
              <Thumb file={f} />
              <span className={styles.stack}>
                <span className={styles.name}>
                  {f.name} <span className={styles.muted}>· {formatBytesVi(f.bytes)}</span>
                </span>
                <span className={styles.bar} role="progressbar" aria-label={stat(f)} aria-valuenow={Math.round(f.progress * 100)}>
                  <span style={{ width: `${Math.round(f.progress * 100)}%` }} />
                </span>
              </span>
              <span className={styles.meta}>{stat(f)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {waiting.length > 0 ? (
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.label}>{t("waiting")}</span>
          </div>
          {waiting.slice(0, WAITING_SHOWN).map((f) => (
            <div key={f.id} className={styles.row}>
              <Thumb file={f} />
              <span className={styles.name}>
                {f.name} <span className={styles.muted}>· {formatBytesVi(f.bytes)}</span>
              </span>
              <span className={styles.meta}>{t("waitingStat")}</span>
            </div>
          ))}
          {waiting.length > WAITING_SHOWN ? (
            <p className={styles.hint}>{t("waitingMore", { count: waiting.length - WAITING_SHOWN })}</p>
          ) : null}
        </div>
      ) : null}

      {done.length > 0 ? (
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.label}>{t("doneGroup", { count: done.length })}</span>
          </div>
          {done.slice(-DONE_SHOWN).map((f) => (
            <div key={f.id} className={styles.row}>
              <Thumb file={f} />
              <span className={styles.name}>
                {f.name} <span className={styles.muted}>· {formatBytesVi(f.bytes)}</span>
              </span>
              <span className={styles.ok} role="img" aria-label={t("doneLabel")}>
                ✓
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.foot}>
        <span className={styles.hint}>{t("keepGoing")}</span>
        <button type="button" className={styles.button} onClick={onMinimize}>
          {t("minimize")}
        </button>
      </div>
    </section>
  );
}
