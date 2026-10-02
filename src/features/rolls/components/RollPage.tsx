import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, Stamp } from "@/design-system";
import { CanisterEditor } from "@/features/canister/components/CanisterEditor";
import { RollViews } from "@/features/collection/components/RollViews";
import type { TFrameFilter } from "@/features/collection/filters";
import type { TRollView } from "@/features/collection/view-pref";
import { cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import type { IRollEntry } from "@/features/rolls/core";
import { formatRollDate } from "@/features/rolls/format-date";
import type { IRollFrame } from "@/features/frames/core";
import type { IRollMistake } from "@/features/mistakes/core";
import type { IRollNote } from "@/features/notes/core";
import { formatNoteDate } from "@/features/notes/components/format";
import { RollScans } from "@/features/scan-sets/components/RollScans";
import type { IScanSetSummary } from "@/features/scan-sets/core";
import { pushPullStops } from "@/features/rolls/push-pull";
import styles from "./RollPage.module.css";

export interface RollPageProps {
  roll: IRollEntry;
  /** R1: the "Đã lên kệ." banner shows only right after saving (`?saved=1`), not on every later visit. */
  justSaved?: boolean;
  /** The upload tray links here with `?upload=1` to reopen the upload list (Phase 2 D16). */
  openUpload?: boolean;
  /** The roll's scan set (LAB-3), or null before the first upload. */
  scanSet?: IScanSetSummary | null;
  /** Ready frames by position (SCAN-4), empty before the first upload. */
  frames?: IRollFrame[];
  /** The roll's notes, newest first (NOTE-1). */
  notes?: IRollNote[];
  /** The roll's live mistakes (NOTE-2); roll-level ones are stamped on the header. */
  mistakes?: IRollMistake[];
  /** COL-1: Dải phim (default) or Lưới, resolved from the URL and the remembered view. */
  view?: TRollView;
  /** COL-2: the grid's filter, from the URL. */
  filter?: TFrameFilter;
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
export async function RollPage({ roll, justSaved = false, openUpload = false, scanSet = null, frames = [], notes = [], mistakes = [], view = "strip", filter = "all" }: RollPageProps) {
  const t = await getTranslations("rolls.page");
  const tTypes = await getTranslations("catalogue.types");
  const tFrames = await getTranslations("frames");
  const tNotes = await getTranslations("notes");
  const tMistakes = await getTranslations("mistakes");
  const rollMistakes = mistakes.filter((m) => m.frameId === null);
  const keeperCount = frames.filter((f) => f.isKeeper).length;
  const oopsCount = frames.filter((f) => f.isOops).length;

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

  // D8: the scan-set form prefills push/pull in thirds of a stop.
  const stops = pushPullStops(roll.boxIso, roll.shotIso);
  const pushPullThirds = stops === null ? null : Math.round(stops * 3);

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

  // RollStrip: the strip's lower rail, "GOLD 200 · CUỘN 14".
  const edgeText = [roll.stock?.name.toUpperCase(), roll.number != null ? t("stripEdge", { number: roll.number }) : null].filter(Boolean).join(" · ");

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
        <div className={styles.ok} role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>
            <b>{t("savedTitle")}</b> {t("savedBody")}
          </span>
          <Link href={`/rolls/${roll.id}/edit`} className={styles.editLink}>
            {t("edit")}
          </Link>
        </div>
      ) : null}

      {/* RollStrip: the title block on the left, the roll's canister on the right; it opens the canister editor (CAN-2). */}
      <div className={styles.header}>
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
        <CanisterEditor roll={roll} />
      </div>

      <div className={styles.stamps}>
        {frames.length === 0 && (roll.frameCount ?? 0) === 0 ? (
          <Stamp tone="ink" icon="upload" label={t("waitingScan")}>
            {t("waitingScan")}
          </Stamp>
        ) : null}
        {frames.length > 0 ? <Stamp tone="ink">{tFrames("stampFrames", { count: frames.length })}</Stamp> : null}
        {keeperCount > 0 ? (
          <Stamp tone="keeper" icon="keeper" label={tFrames("stampKeepers", { count: keeperCount })}>
            {keeperCount}
          </Stamp>
        ) : null}
        {rollMistakes.map((m) => (
          <Stamp key={m.id} tone="oops" icon="oops" label={tMistakes(`types.${m.type}`)}>
            {tMistakes(`types.${m.type}`)}
          </Stamp>
        ))}
        {oopsCount > 0 ? (
          <Stamp tone="oops" icon="oops" label={tFrames("stampOops", { count: oopsCount })}>
            {oopsCount}
          </Stamp>
        ) : null}
        {roll.pushPull && roll.pushPull !== "0" ? (
          <Stamp>{t(roll.pushPull.startsWith("−") ? "pushPullStampPull" : "pushPullStampPush", { pp: roll.pushPull })}</Stamp>
        ) : null}
        {roll.format ? <Stamp>{roll.exposures ? `${roll.format} · ${roll.exposures} exp` : roll.format}</Stamp> : null}
      </div>

      {/* COL-1 / COL-2 (RollStrip, RollGrid): the switch, then the strip edge to edge or the filtered grid. */}
      {frames.length > 0 ? (
        <section aria-label={tFrames("heading")} className={styles.frames}>
          <RollViews rollId={roll.id} frames={frames} view={view} filter={filter} edgeText={edgeText} />
        </section>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
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
          <section aria-labelledby="roll-memory-heading" className={`${styles.section} ${styles.notes}`}>
            <div className={styles.sectionHead}>
              <h2 id="roll-memory-heading" className={styles.sectionHeading}>
                {tNotes("memoryHeading")}
              </h2>
              <Link href={`/rolls/${roll.id}/notes`} className={styles.sectionLink}>
                {tNotes("previewEdit")}
              </Link>
            </div>
            <p className={styles.memory}>{roll.memory ?? tNotes("previewMemoryEmpty")}</p>
          </section>

          <section aria-labelledby="roll-notes-heading" className={`${styles.section} ${styles.notes}`}>
            <div className={styles.sectionHead}>
              <h2 id="roll-notes-heading" className={styles.sectionHeading}>
                {tNotes("notesHeading", { count: notes.length })}
              </h2>
              <Link href={`/rolls/${roll.id}/notes`} className={styles.sectionLink}>
                {tNotes("previewAdd")}
              </Link>
            </div>
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className={styles.notePreview}>
                <p>{n.body}</p>
                <span>{formatNoteDate(n.createdAt)}</span>
              </div>
            ))}
          </section>

          <section aria-labelledby="roll-scan-heading" className={`${styles.section} ${styles.scan}`}>
            <h2 id="roll-scan-heading" className={styles.sectionHeading}>
              {t("scanHeading")}
            </h2>
            <RollScans
              rollId={roll.id}
              rollLabel={numberedTitle ?? title}
              frameCount={roll.frameCount ?? 0}
              rollPushPullThirds={pushPullThirds}
              scanSet={scanSet}
              initialOpenUpload={openUpload}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
