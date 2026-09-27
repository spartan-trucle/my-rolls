"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Field, Icon } from "@/design-system";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { listBag } from "@/features/bag/actions";
import type { TBagEntry, TCameraRow, TLensRow, TStockRow } from "@/features/bag/queries";
import { CataloguePicker } from "@/features/catalogue/components/CataloguePicker";
import { CustomEntryForm, type ICustomEntryCreated, type TCustomEntryKind } from "@/features/catalogue/components/CustomEntryForm";
import type { TCatalogueEntry, TCatalogueKind } from "@/features/catalogue/queries";
import { createRoll } from "@/features/rolls/actions";
import { isFutureVnDay } from "@/features/rolls/date-utils";
import { formatPushPull, pushPullStops } from "@/features/rolls/push-pull";
import styles from "./RollForm.module.css";

export interface RollFormProps {
  /** `"new"`: the roll is loaded now. `"past"`: it's already shot, dates required (D14, `?mode=past`). */
  mode: "new" | "past";
}

type TFormat = "35mm" | "120";
const FORMATS: TFormat[] = ["35mm", "120"];

type TDialogMode =
  | { view: "closed" }
  | { view: "picker"; kind: TCatalogueKind }
  | { view: "custom"; kind: TCustomEntryKind; query?: string };

/** The board's `.mcan`: a small canister capsule inside a film chip, coloured by `stock.canisterColor`. */
function CanisterChipSwatch({ color }: { color: string | null }) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;
  return <span className={styles.mcan} style={style} aria-hidden="true" />;
}

/** `TBagEntry`, narrowed and flattened to what the pickers below need. */
function splitBag(entries: TBagEntry[]) {
  const stocks: TStockRow[] = [];
  const cameras: Array<{ camera: TCameraRow; bagItemId: string; fixedStock: TStockRow | null }> = [];
  const lenses: TLensRow[] = [];

  for (const entry of entries) {
    if (entry.kind === "stock") stocks.push(entry.stock);
    else if (entry.kind === "camera") cameras.push({ camera: entry.camera, bagItemId: entry.bagItemId, fixedStock: entry.fixedStock });
    else lenses.push(entry.lens);
  }

  return { stocks, cameras, lenses };
}

/**
 * D3: `/rolls/new` and `/rolls/new?mode=past` — bag first ("Trong túi"),
 * the catalogue one tap away (`CataloguePicker`/`CustomEntryForm` in
 * `ResponsiveDialog`, D1), box ISO filled from the stock, a live push/pull
 * badge. Only film and camera are required; everything else is folded
 * behind "Thêm chi tiết" so the two picks and Save fit on one phone
 * screen (the 60s exit).
 */
export function RollForm({ mode }: RollFormProps) {
  const t = useTranslations("rolls.form");
  const router = useRouter();
  const titleId = useId();

  const [bagEntries, setBagEntries] = useState<TBagEntry[] | null>(null);
  // `null` means "no explicit pick yet" — the effective selection (below)
  // falls back to the first bag item, computed during render rather than
  // written back with an effect (no cascading setState-in-effect).
  const [explicitStockId, setExplicitStockId] = useState<string | null>(null);
  const [explicitCameraBagItemId, setExplicitCameraBagItemId] = useState<string | null>(null);
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<TDialogMode>({ view: "closed" });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState("");
  // `null` means "not edited yet" — the displayed value falls back to the
  // selected stock's box ISO, same reasoning as the selections above.
  const [boxIsoOverride, setBoxIsoOverride] = useState<string | null>(null);
  const [shotIso, setShotIso] = useState("");
  const [exposures, setExposures] = useState("");
  const [format, setFormat] = useState<TFormat | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [locationDraft, setLocationDraft] = useState("");
  const [shotFromInput, setShotFromInput] = useState("");
  const [shotToInput, setShotToInput] = useState("");
  const [shotFromError, setShotFromError] = useState<string | null>(null);
  const [shotToError, setShotToError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formOpenedAtRef = useRef<number | null>(null);
  const openedTrackedRef = useRef(false);

  useEffect(() => {
    if (openedTrackedRef.current) return;
    openedTrackedRef.current = true;
    formOpenedAtRef.current = Date.now();
    posthog.capture("roll_form_opened", { mode });
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    listBag().then((entries) => {
      if (!cancelled) setBagEntries(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { stocks: bagStocks, cameras: bagCameras, lenses: bagLenses } = useMemo(
    () => splitBag(bagEntries ?? []),
    [bagEntries],
  );

  // D3: bag first — an explicit pick wins, otherwise the first bag item is
  // the default. Computed during render (no effect, no cascading
  // setState) so it always reflects the latest bag without a render lag.
  const selectedCameraBagItemId = explicitCameraBagItemId ?? bagCameras[0]?.bagItemId ?? null;
  const selectedCamera = bagCameras.find((entry) => entry.bagItemId === selectedCameraBagItemId) ?? null;
  // D20: a single-use camera's film is fixed — the stock picker locks to it.
  const lockedStock = selectedCamera?.fixedStock ?? null;
  const selectedStockId = lockedStock ? lockedStock.id : (explicitStockId ?? bagStocks[0]?.id ?? null);
  const effectiveStockId = selectedStockId;
  const selectedStock = lockedStock ?? bagStocks.find((stock) => stock.id === selectedStockId) ?? null;

  const boxIso = boxIsoOverride ?? (selectedStock?.iso != null ? String(selectedStock.iso) : "");
  const boxIsoNumber = boxIso.trim() === "" ? null : Number(boxIso);
  const shotIsoNumber = shotIso.trim() === "" ? null : Number(shotIso);
  const pushPull = formatPushPull(pushPullStops(boxIsoNumber, shotIsoNumber));

  async function refreshBag(): Promise<TBagEntry[]> {
    const entries = await listBag();
    setBagEntries(entries);
    return entries;
  }

  function closeDialog() {
    setDialog({ view: "closed" });
  }

  async function handlePicked(entry: TCatalogueEntry) {
    const entries = await refreshBag();
    if (entry.kind === "stock") {
      setExplicitStockId(entry.id);
    } else {
      const match = entries.find((e) => e.kind === "camera" && e.camera.id === entry.id);
      if (match) setExplicitCameraBagItemId(match.bagItemId);
    }
    closeDialog();
  }

  async function handleCreated(entry: ICustomEntryCreated) {
    const entries = await refreshBag();
    if (entry.kind === "stock") {
      setExplicitStockId(entry.refId);
    } else if (entry.kind === "camera") {
      const match = entries.find((e) => e.kind === "camera" && e.camera.id === entry.refId);
      if (match) setExplicitCameraBagItemId(match.bagItemId);
    } else {
      setSelectedLensId(entry.refId);
    }
    closeDialog();
  }

  function addLocation(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = locationDraft.trim();
    if (!value) return;
    setLocations((prev) => [...prev, value]);
    setLocationDraft("");
  }

  function removeLocation(index: number) {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  }

  function parseVnDateInput(value: string): number | undefined {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    // Noon avoids any DST/offset edge landing on the wrong calendar day.
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getTime();
  }

  function validatePastDates(): { shotFrom: number; shotTo: number } | null {
    const now = Date.now();
    const fromMs = parseVnDateInput(shotFromInput);
    const toMs = parseVnDateInput(shotToInput);
    let nextFromError: string | null = null;
    let nextToError: string | null = null;

    if (fromMs === undefined) nextFromError = t("errorRequired");
    else if (isFutureVnDay(fromMs, now)) nextFromError = t("errorFutureDate");

    if (toMs === undefined) nextToError = t("errorRequired");
    else if (isFutureVnDay(toMs, now)) nextToError = t("errorFutureDate");

    if (!nextFromError && !nextToError && fromMs !== undefined && toMs !== undefined && fromMs > toMs) {
      nextToError = t("errorDateRange");
    }

    setShotFromError(nextFromError);
    setShotToError(nextToError);

    if (nextFromError || nextToError || fromMs === undefined || toMs === undefined) return null;
    return { shotFrom: fromMs, shotTo: toMs };
  }

  async function handleSave() {
    setFormError(null);
    if (!effectiveStockId || !selectedCameraBagItemId) return;

    let pastDates: { shotFrom: number; shotTo: number } | null = null;
    if (mode === "past") {
      pastDates = validatePastDates();
      if (!pastDates) return;
    }

    setSaving(true);
    const result = await createRoll({
      mode,
      stockId: effectiveStockId,
      cameraBagItemId: selectedCameraBagItemId,
      lensId: selectedLensId ?? undefined,
      name: name.trim() || undefined,
      boxIso: boxIsoNumber ?? undefined,
      shotIso: shotIsoNumber ?? undefined,
      exposures: exposures.trim() ? Number(exposures) : undefined,
      format: format ?? undefined,
      locations: locations.length > 0 ? locations : undefined,
      shotFrom: pastDates?.shotFrom,
      shotTo: pastDates?.shotTo,
      formOpenedAt: formOpenedAtRef.current ?? undefined,
    });
    setSaving(false);

    if (result.ok) {
      router.push(`/rolls/${result.rollId}`);
    } else {
      setFormError(t("errorGeneric"));
    }
  }

  const canSave = effectiveStockId !== null && selectedCameraBagItemId !== null && !saving;

  return (
    <div className={styles.page}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{t(mode === "past" ? "pastHeading" : "newHeading")}</h1>
        <p className={styles.lead}>{t(mode === "past" ? "pastLead" : "newLead")}</p>
      </div>

      <div className={styles.seg} role="group" aria-label={t("modeGroupLabel")}>
        <Link href="/rolls/new" aria-current={mode === "new" ? "page" : undefined}>
          {t("modeNew")}
        </Link>
        <Link href="/rolls/new?mode=past" aria-current={mode === "past" ? "page" : undefined}>
          {t("modePast")}
        </Link>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendRow}>
          <span className={styles.legendLabel}>{t("filmLegend")}</span>
          <span className={styles.required}>{t("required")}</span>
        </legend>
        {bagEntries === null ? (
          <p className={styles.hint}>{t("loadingBag")}</p>
        ) : bagStocks.length === 0 && !lockedStock ? (
          <p className={styles.hint}>{t("emptyBagStock")}</p>
        ) : (
          <div className={styles.chips}>
            {bagStocks.map((stockRow) => (
              <label key={stockRow.id} className={styles.chip} data-checked={selectedStockId === stockRow.id}>
                <input
                  type="radio"
                  name="roll-stock"
                  className={styles.srOnly}
                  checked={selectedStockId === stockRow.id}
                  disabled={lockedStock !== null}
                  onChange={() => {
                    setExplicitStockId(stockRow.id);
                    setBoxIsoOverride(null);
                  }}
                />
                <CanisterChipSwatch color={stockRow.canisterColor} />
                <span>
                  {stockRow.brand} {stockRow.name}
                </span>
              </label>
            ))}
          </div>
        )}
        {lockedStock ? <p className={styles.fieldHint}>{t("fixedFilmHint", { name: `${lockedStock.brand} ${lockedStock.name}` })}</p> : null}
        <button
          type="button"
          className={styles.chipAdd}
          onClick={() => setDialog({ view: "picker", kind: "stock" })}
          disabled={lockedStock !== null}
        >
          {t("addStock")}
        </button>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legendRow}>
          <span className={styles.legendLabel}>{t("cameraLegend")}</span>
          <span className={styles.required}>{t("required")}</span>
        </legend>
        {bagEntries === null ? (
          <p className={styles.hint}>{t("loadingBag")}</p>
        ) : bagCameras.length === 0 ? (
          <p className={styles.hint}>{t("emptyBagCamera")}</p>
        ) : (
          <div className={styles.chips}>
            {bagCameras.map(({ camera, bagItemId }) => (
              <label key={bagItemId} className={styles.chip} data-checked={selectedCameraBagItemId === bagItemId}>
                <input
                  type="radio"
                  name="roll-camera"
                  className={styles.srOnly}
                  checked={selectedCameraBagItemId === bagItemId}
                  onChange={() => setExplicitCameraBagItemId(bagItemId)}
                />
                <Icon name="camera" size={18} />
                <span>
                  {camera.brand} {camera.model}
                </span>
              </label>
            ))}
          </div>
        )}
        <button type="button" className={styles.chipAdd} onClick={() => setDialog({ view: "picker", kind: "camera" })}>
          {t("addCamera")}
        </button>
      </fieldset>

      {mode === "past" ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.legendLabel}>{t("pastDatesLegend")}</legend>
          <div className={styles.two}>
            <Field
              label={t("shotFromLabel")}
              type="date"
              mono
              value={shotFromInput}
              onChange={(event) => setShotFromInput(event.target.value)}
              error={shotFromError}
            />
            <Field
              label={t("shotToLabel")}
              type="date"
              mono
              value={shotToInput}
              onChange={(event) => setShotToInput(event.target.value)}
              error={shotToError}
            />
          </div>
          <p className={styles.fieldHint}>{t("pastDatesHint")}</p>
        </fieldset>
      ) : null}

      <button
        type="button"
        className={styles.details}
        aria-expanded={detailsOpen}
        aria-controls="roll-form-details"
        onClick={() => setDetailsOpen((prev) => !prev)}
      >
        <span className={styles.detailsText}>
          <span className={styles.detailsTitle}>{t("detailsToggle")}</span>
          <span className={styles.detailsSub}>{t("detailsHint")}</span>
        </span>
        <svg
          className={styles.chevron}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {detailsOpen ? (
        <div id="roll-form-details" className={styles.detailsPanel}>
          <Field label={t("nameLabel")} placeholder={t("namePlaceholder")} value={name} onChange={(event) => setName(event.target.value)} />

          <fieldset className={styles.fieldset}>
            <legend className={styles.legendLabel}>{t("lensLegend")}</legend>
            <div className={styles.chips}>
              {bagLenses.map((lensRow) => (
                <label key={lensRow.id} className={styles.chip} data-checked={selectedLensId === lensRow.id}>
                  <input
                    type="radio"
                    name="roll-lens"
                    className={styles.srOnly}
                    checked={selectedLensId === lensRow.id}
                    onChange={() => setSelectedLensId(lensRow.id)}
                  />
                  <span>
                    {lensRow.brand} {lensRow.model ?? ""}
                  </span>
                </label>
              ))}
              <button type="button" className={styles.chipAdd} onClick={() => setDialog({ view: "custom", kind: "lens" })}>
                {t("addLens")}
              </button>
            </div>
          </fieldset>

          <div className={styles.two}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{t("formatLabel")}</span>
              <div className={styles.seg} role="group" aria-label={t("formatLabel")}>
                {FORMATS.map((value) => (
                  <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)}>
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label={t("exposuresLabel")}
              mono
              inputMode="numeric"
              value={exposures}
              onChange={(event) => setExposures(event.target.value)}
            />
          </div>

          <div className={styles.two}>
            <Field
              label={t("boxIsoLabel")}
              mono
              inputMode="numeric"
              value={boxIso}
              onChange={(event) => {
                setBoxIsoOverride(event.target.value);
              }}
            />
            <Field
              label={t("shotIsoLabel")}
              mono
              inputMode="numeric"
              placeholder={boxIso}
              value={shotIso}
              onChange={(event) => setShotIso(event.target.value)}
            />
          </div>

          {pushPull ? (
            <div className={styles.pushPull} aria-live="polite">
              <span className={styles.legendLabel}>{t("pushPullLabel")}</span>
              <b>{pushPull}</b>
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="roll-form-location">
              {t("locationsLabel")}
            </label>
            {locations.length > 0 ? (
              <div className={styles.chips}>
                {locations.map((location, index) => (
                  <span key={`${location}-${index}`} className={styles.tag}>
                    {location}
                    <button type="button" aria-label={t("removeLocation", { location })} onClick={() => removeLocation(index)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input
              id="roll-form-location"
              className={styles.textInput}
              placeholder={t("locationsPlaceholder")}
              value={locationDraft}
              onChange={(event) => setLocationDraft(event.target.value)}
              onKeyDown={addLocation}
            />
            <span className={styles.fieldHint}>{t("locationsHint")}</span>
          </div>
        </div>
      ) : null}

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <div className={styles.footer}>
        <button type="button" className={styles.save} disabled={!canSave} onClick={handleSave}>
          {t(mode === "past" ? "savePast" : "saveNew")}
        </button>
      </div>

      <ResponsiveDialog open={dialog.view !== "closed"} onClose={closeDialog} labelledBy={titleId}>
        {dialog.view === "picker" ? (
          <CataloguePicker
            titleId={titleId}
            initialKind={dialog.kind}
            onPicked={handlePicked}
            onAddCustom={(kind, query) => setDialog({ view: "custom", kind, query })}
          />
        ) : dialog.view === "custom" ? (
          <CustomEntryForm titleId={titleId} initialKind={dialog.kind} initialQuery={dialog.query} onCreated={handleCreated} />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
