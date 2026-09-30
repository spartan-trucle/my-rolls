import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, Scribble, Stamp } from "@/design-system";
import { Canister } from "@/components/canister/Canister";
import { cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import type { IRollEntry } from "@/features/rolls/core";
import { formatRollDate } from "@/features/rolls/format-date";
import styles from "./RollPage.module.css";
import { SavedToast } from "./SavedToast";

export interface RollPageProps {
  roll: IRollEntry;
  /** R1: the "Đã lên kệ." banner shows only right after saving (`?saved=1`), not on every later visit. */
  justSaved?: boolean;
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

function joinMeta(parts: Array<string | false | null | undefined>): string | null {
  const joined = parts.filter(Boolean).join(" · ");
  return joined === "" ? null : joined;
}

/**
 * D15: `/rolls/[id]`, per the `RollSaved` board — canister and title, stock
 * and camera in mono, dates, the push/pull badge, and a "chờ scan" state
 * whose upload call to action stays a disabled placeholder until Phase 2
 * (SCAN-1). `getRollPageContent` (the page itself) already 404s a missing
 * or another user's roll; this only renders one that was found.
 */
export async function RollPage({ roll, justSaved = false }: RollPageProps) {
  const t = await getTranslations("rolls.page");
  const tTypes = await getTranslations("catalogue.types");
  const tCommon = await getTranslations("common");

  const stockTypeLabel = roll.stock ? stockTypeLabelKey(roll.stock.type) : null;
  const cameraTypeLabel = roll.camera ? cameraTypeLabelKey(roll.camera.type) : null;

  const stockLabel = roll.stock
    ? [`${roll.stock.brand} ${roll.stock.name}`, stockTypeLabel ? tTypes(stockTypeLabel) : null].filter(Boolean).join(" · ")
    : null;
  const cameraLabel = roll.camera
    ? [`${roll.camera.brand} ${roll.camera.model}`, cameraTypeLabel ? tTypes(cameraTypeLabel) : null].filter(Boolean).join(" · ")
    : null;
  const lensLabel = roll.lens ? `${roll.lens.brand} ${roll.lens.model ?? ""}`.trim() : null;
  // R2/N1: an unnamed roll shows "Cuộn #N" — never stored, only displayed.
  const numberedTitle = roll.number != null ? t("titleFallback", { number: roll.number }) : null;
  const title = roll.name ?? numberedTitle ?? (roll.stock ? `${roll.stock.brand} ${roll.stock.name}` : null) ?? t("detailFilm");

  const shotIsoLine =
    roll.shotIso !== null ? `${roll.shotIso}${roll.pushPull && roll.pushPull !== "0" ? ` · ${roll.pushPull}` : ""}` : null;

  // R3: "GOLD 200 · ISO 200 → 400 · 36 EXP" / "PENTAX K1000 · NẠP dd.mm.yy · nơi chụp".
  const filmMetaLine = roll.stock
    ? joinMeta([
        `${roll.stock.brand} ${roll.stock.name}`.toUpperCase(),
        roll.boxIso !== null ? `ISO ${roll.boxIso}${roll.shotIso !== null && roll.shotIso !== roll.boxIso ? ` → ${roll.shotIso}` : ""}` : null,
        roll.exposures !== null ? `${roll.exposures} EXP` : null,
      ])
    : null;
  const cameraMetaLine = roll.camera
    ? joinMeta([
        `${roll.camera.brand} ${roll.camera.model}`.toUpperCase(),
        roll.shotFrom !== null ? `${t("detailShotFrom").toUpperCase()} ${formatRollDate(roll.shotFrom, roll.datePrecision)}` : null,
        roll.locations && roll.locations.length > 0 ? roll.locations.join(", ").toUpperCase() : null,
      ])
    : null;

  const formatDetail = joinMeta([roll.format, roll.exposures !== null ? t("detailFormatExposures", { count: roll.exposures }) : null]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.back}>
          {t("backHome")}
        </Link>
        <Link href={`/rolls/${roll.id}/edit`} className={styles.editDetailsLink}>
          {t("editDetails")}
        </Link>
      </div>

      {justSaved ? (
        <SavedToast
          title={t("savedTitle")}
          body={t("savedBody")}
          editHref={`/rolls/${roll.id}/edit`}
          editLabel={t("edit")}
          closeLabel={tCommon("close")}
        />
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.headingBlock}>
            {/* The number kicker only adds something over a name; an unnamed roll's title is already "Cuộn #N". */}
            {roll.name !== null && roll.number != null ? <span className={styles.kicker}><Icon name="roll" size={16} /> {t("kickerNumber", { number: roll.number })}</span> : null}
            <h1 className={styles.heading}>{title}</h1>
            {roll.name === null ? (
              <Link href={`/rolls/${roll.id}/edit`} className={styles.nameLink}>
                {t("nameLink")}
              </Link>
            ) : null}
            {(filmMetaLine || cameraMetaLine) ? (
              <p className={styles.metaLine}>
                {filmMetaLine}
                {filmMetaLine && cameraMetaLine ? <br /> : null}
                {cameraMetaLine}
              </p>
            ) : null}
          </div>

          <div className={styles.stamps}>
            <Stamp tone="ink" icon="upload" label={t("waitingScan")}>
              {t("waitingScan")}
            </Stamp>
            {roll.pushPull && roll.pushPull !== "0" ? (
              <Stamp>{t(roll.pushPull.startsWith("−") ? "pushPullStampPull" : "pushPullStampPush", { pp: roll.pushPull })}</Stamp>
            ) : null}
            {roll.format ? <Stamp>{roll.exposures ? `${roll.format} · ${roll.exposures} exp` : roll.format}</Stamp> : null}
          </div>

          <section aria-labelledby="roll-details-heading" className={`${styles.section} ${styles.details}`}>
            <div className={styles.detailsHeadingRow}>
              <h2 id="roll-details-heading" className={styles.sectionHeading}>
                {t("detailsHeading")}
              </h2>
              <Link href={`/rolls/${roll.id}/edit`}>{t("edit")}</Link>
            </div>
            <dl className={styles.dl}>
              <DetailRow label={t("detailFilm")} value={stockLabel} />
              <DetailRow label={t("detailCamera")} value={cameraLabel} />
              <DetailRow label={t("detailLens")} value={lensLabel} />
              <DetailRow label={t("detailShotIso")} value={shotIsoLine} />
              <DetailRow label={t("detailFormat")} value={formatDetail} />
              <DetailRow label={t("detailShotFrom")} value={formatRollDate(roll.shotFrom, roll.datePrecision)} />
              <DetailRow label={t("detailShotTo")} value={formatRollDate(roll.shotTo, roll.datePrecision)} />
              <DetailRow label={t("detailLocations")} value={roll.locations && roll.locations.length > 0 ? roll.locations.join(", ") : null} />
            </dl>
          </section>
        </div>

        <div className={styles.side}>
          {/* RollSavedWeb: the roll's canister standing on the shelf ledge
              beside two empty slots, the note at the end of the row. */}
          <div className={styles.shelf} aria-hidden="true">
            <div className={styles.shelfRow}>
              <span className={styles.shelfSlot} />
              <span className={styles.shelfSlot} />
              <Canister color={roll.canisterColor} iso={roll.boxIso} />
              <span className={styles.shelfNote}>
                <Scribble arrow="left" size="sm">
                  {t("canisterScribble")}
                </Scribble>
              </span>
            </div>
            <div className={styles.ledge} />
            <div className={styles.ledgeBase} />
          </div>

          <section aria-labelledby="roll-scan-heading" className={`${styles.section} ${styles.scan}`}>
            <h2 id="roll-scan-heading" className={styles.sectionHeading}>
              {t("scanHeading")}
            </h2>
            <div className={styles.scanPlaceholder}>
              <Icon name="upload" size={28} />
              <p className={styles.scanTitle}>{t("scanComingSoon")}</p>
              <p className={styles.scanBody}>{t("scanComingSoonBody")}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
