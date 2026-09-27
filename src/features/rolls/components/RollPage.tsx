import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, Stamp } from "@/design-system";
import type { IRollEntry } from "@/features/rolls/core";
import { formatRollDate } from "@/features/rolls/format-date";
import styles from "./RollPage.module.css";

export interface RollPageProps {
  roll: IRollEntry;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

/**
 * D15: `/rolls/[id]`, per the `RollSaved` board — canister and title, stock
 * and camera in mono, dates, the push/pull badge, and a "chờ scan" state
 * whose upload call to action stays a disabled placeholder until Phase 2
 * (SCAN-1). `getRollPageContent` (the page itself) already 404s a missing
 * or another user's roll; this only renders one that was found.
 */
export async function RollPage({ roll }: RollPageProps) {
  const t = await getTranslations("rolls.page");

  const stockLabel = roll.stock ? `${roll.stock.brand} ${roll.stock.name}` : null;
  const cameraLabel = roll.camera ? `${roll.camera.brand} ${roll.camera.model}` : null;
  const lensLabel = roll.lens ? `${roll.lens.brand} ${roll.lens.model ?? ""}`.trim() : null;
  const title = roll.name ?? stockLabel ?? t("detailFilm");

  const shotIsoLine =
    roll.shotIso !== null ? `${roll.shotIso}${roll.pushPull && roll.pushPull !== "0" ? ` · ${roll.pushPull}` : ""}` : null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.back}>
          {t("backHome")}
        </Link>
      </div>

      <div className={styles.ok} role="status">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        <span>
          <b>{t("savedTitle")}</b> {t("savedBody")}
        </span>
      </div>

      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{title}</h1>
      </div>

      <div className={styles.stamps}>
        <Stamp tone="ink" icon="upload" label={t("waitingScan")}>
          {t("waitingScan")}
        </Stamp>
        {roll.pushPull && roll.pushPull !== "0" ? <Stamp>{roll.pushPull}</Stamp> : null}
        {roll.format ? <Stamp>{roll.exposures ? `${roll.format} · ${roll.exposures} exp` : roll.format}</Stamp> : null}
      </div>

      <section aria-labelledby="roll-scan-heading" className={styles.section}>
        <h2 id="roll-scan-heading" className={styles.sectionHeading}>
          {t("scanHeading")}
        </h2>
        <div className={styles.scanPlaceholder}>
          <Icon name="upload" size={28} />
          <p className={styles.scanTitle}>{t("scanComingSoon")}</p>
          <p className={styles.scanBody}>{t("scanComingSoonBody")}</p>
        </div>
      </section>

      <section aria-labelledby="roll-details-heading" className={styles.section}>
        <div className={styles.detailsHeadingRow}>
          <h2 id="roll-details-heading" className={styles.sectionHeading}>
            {t("detailsHeading")}
          </h2>
        </div>
        <dl className={styles.dl}>
          <DetailRow label={t("detailFilm")} value={stockLabel} />
          <DetailRow label={t("detailCamera")} value={cameraLabel} />
          <DetailRow label={t("detailLens")} value={lensLabel} />
          <DetailRow label={t("detailShotIso")} value={shotIsoLine} />
          <DetailRow label={t("detailFormat")} value={roll.format} />
          <DetailRow label={t("detailShotFrom")} value={formatRollDate(roll.shotFrom)} />
          <DetailRow label={t("detailShotTo")} value={formatRollDate(roll.shotTo)} />
          <DetailRow label={t("detailLocations")} value={roll.locations && roll.locations.length > 0 ? roll.locations.join(", ") : null} />
        </dl>
      </section>

      <Link href="/" className={styles.backToShelf}>
        {t("backToShelf")}
      </Link>
    </div>
  );
}
