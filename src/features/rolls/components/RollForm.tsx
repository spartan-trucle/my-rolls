"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Field, Icon, RollCard, Scribble } from "@/design-system";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { DatePicker } from "@/components/ui/date-picker";
import { listBag } from "@/features/bag/actions";
import type { TBagEntry, TCameraRow, TLensRow, TStockRow } from "@/features/bag/queries";
import { CataloguePicker } from "@/features/catalogue/components/CataloguePicker";
import { CustomEntryForm, type ICustomEntryCreated, type TCustomEntryKind } from "@/features/catalogue/components/CustomEntryForm";
import { cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import { searchCatalogue } from "@/features/catalogue/actions";
import type { TCatalogueEntry, TCatalogueKind } from "@/features/catalogue/queries";
import { createRoll, getNextRollNumber, updateRoll } from "@/features/rolls/actions";
import type { IRollEntry } from "@/features/rolls/core";
import { toVnDateString, vnMonthEnd, vnMonthStart } from "@/features/rolls/date-utils";
import { formatPushPull, pushPullStops } from "@/features/rolls/push-pull";
import { toRollCardProps } from "@/features/rolls/roll-card-mapper";
import styles from "./RollForm.module.css";

export interface RollFormProps {
  /** `"new"`: the roll is loaded now. `"past"`: it's already shot, dates optional/month-precision (D14, `?mode=past`). */
  mode: "new" | "past";
  /** R4: present only on `/rolls/[id]/edit` — switches the form into edit mode (no mode toggle, "Sửa cuộn" heading, `updateRoll` instead of `createRoll`). */
  roll?: IRollEntry;
}

type TFormat = "35mm" | "120";
const FORMATS: TFormat[] = ["35mm", "120"];
const QUICK_ADD_LIMIT = 5;
const DEBOUNCE_MS = 200;
// R2-4: "Chụp khoảng khi nào" year select — this year down to 10 back, then "Lâu hơn nữa".
const YEAR_WINDOW = 10;

type TDialogMode =
  | { view: "closed" }
  | { view: "picker"; kind: TCatalogueKind }
  | { view: "custom"; kind: TCustomEntryKind; query?: string };

/** The board's `.mcan`: a small canister capsule inside a film chip, coloured by `stock.canisterColor`. */
function CanisterChipSwatch({ color }: { color: string | null }) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;
  return <span className={styles.mcan} style={style} aria-hidden="true" />;
}

/** G4/N2: the phone header's close ✕, a plain link (not a dialog) — always lands on `href`, per the boards. */
function CloseLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.xbtn} aria-label={label}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </Link>
  );
}

/** `TBagEntry`, narrowed and flattened to what the pickers below need — stock entries keep BAG-2's `qty` (N6/N5). */
function splitBag(entries: TBagEntry[]) {
  const stocks: Array<{ stock: TStockRow; qty: number | null | undefined }> = [];
  const cameras: Array<{ camera: TCameraRow; bagItemId: string; fixedStock: TStockRow | null }> = [];
  const lenses: TLensRow[] = [];

  for (const entry of entries) {
    if (entry.kind === "stock") stocks.push({ stock: entry.stock, qty: entry.qty });
    else if (entry.kind === "camera") cameras.push({ camera: entry.camera, bagItemId: entry.bagItemId, fixedStock: entry.fixedStock });
    else lenses.push(entry.lens);
  }

  return { stocks, cameras, lenses };
}

function vnNowMonthYear(): { month: number; year: number } {
  const [year, month] = toVnDateString(Date.now()).split("-").map(Number);
  return { month, year };
}

/**
 * D3: `/rolls/new`, `/rolls/new?mode=past` and (R4) `/rolls/[id]/edit` —
 * bag first ("Trong túi"), the catalogue one tap away inline (N3/N4) for
 * film and a dialog for camera/lens, box ISO filled from the stock, a
 * live push/pull badge (N8). Only film and camera are required;
 * everything else is folded behind "Thêm chi tiết" so the two picks and
 * Save fit on one phone screen (the 60s exit).
 */
export function RollForm({ mode, roll }: RollFormProps) {
  const t = useTranslations("rolls.form");
  const tTypes = useTranslations("catalogue.types");
  const tPicker = useTranslations("catalogue.picker");
  const tPage = useTranslations("rolls.page");
  const router = useRouter();
  const titleId = useId();
  const isEdit = roll !== undefined;

  const [bagEntries, setBagEntries] = useState<TBagEntry[] | null>(null);
  // `null` means "no explicit pick yet" — the effective selection (below)
  // falls back to the first bag item (or the edited roll's own pick),
  // computed during render rather than written back with an effect.
  const [explicitStockId, setExplicitStockId] = useState<string | null>(roll?.stockId ?? null);
  const [explicitCameraBagItemId, setExplicitCameraBagItemId] = useState<string | null>(roll?.cameraBagItemId ?? null);
  const [selectedLensId, setSelectedLensId] = useState<string | null>(roll?.lensId ?? null);
  const [dialog, setDialog] = useState<TDialogMode>({ view: "closed" });

  // N3/N4: a stock picked from the inline quick-add search that isn't in
  // the bag yet — rendered as an extra "mới" chip and offered the "add to
  // the bag for next time" checkbox. `null` once nothing like that is
  // picked (including when the pick turned out to already be in the bag).
  const [pendingNewStock, setPendingNewStock] = useState<TStockRow | null>(null);
  const [addPendingToBag, setAddPendingToBag] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState("");
  const [quickAddDebounced, setQuickAddDebounced] = useState("");
  const [quickAddResults, setQuickAddResults] = useState<TCatalogueEntry[]>([]);
  const [quickAddResultsQuery, setQuickAddResultsQuery] = useState<string | null>(null);
  const quickAddRequestId = useRef(0);

  const [nextNumber, setNextNumber] = useState<number | null>(roll?.number ?? null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(roll?.name ?? "");
  // `null` means "not edited yet" — the displayed value falls back to the
  // selected stock's box ISO, same reasoning as the selections above.
  const [boxIsoOverride, setBoxIsoOverride] = useState<string | null>(roll?.boxIso != null ? String(roll.boxIso) : null);
  const [shotIso, setShotIso] = useState(roll?.shotIso != null ? String(roll.shotIso) : "");
  // `null` means "not edited yet" — falls back to `defaultExposures` below
  // (owner feedback: 36 prefilled for 35mm, 12 for 120 — N10), same
  // override pattern as `boxIsoOverride`/`format`.
  const [exposuresOverride, setExposuresOverride] = useState<string | null>(roll?.exposures != null ? String(roll.exposures) : null);
  const [format, setFormat] = useState<TFormat | null>((roll?.format as TFormat | null) ?? null);
  const [locations, setLocations] = useState<string[]>(roll?.locations ?? []);
  const [locationDraft, setLocationDraft] = useState("");

  // N7: new mode's optional "Ngày nạp" / "Ngày chụp xong" day pickers —
  // `shotFrom` defaults to today so a shooter who never touches the field
  // still gets a sensible date on save.
  const [loadDateInput, setLoadDateInput] = useState(() =>
    mode === "new" ? (roll?.datePrecision === "day" && roll.shotFrom ? toVnDateString(roll.shotFrom.getTime()) : toVnDateString(Date.now())) : "",
  );
  const [finishDateInput, setFinishDateInput] = useState(() =>
    mode === "new" && roll?.datePrecision === "day" && roll.shotTo ? toVnDateString(roll.shotTo.getTime()) : "",
  );

  // R2-4: past mode's single "Chụp khoảng khi nào" month+year pick —
  // month `"0"` is "Không nhớ", year `"old"` is "Lâu hơn nữa"; either one
  // sends `null` for both `shotFromMonth`/`shotToMonth` (R2-4's "leaving
  // them empty"). Prefilled from an edited roll's own month-precision
  // dates when there are any, otherwise from "now".
  const initialMonthYear = (() => {
    if (roll?.datePrecision === "month" && roll.shotFrom) {
      const [year, month] = toVnDateString(roll.shotFrom.getTime()).split("-").map(Number);
      return { month: String(month), year: String(year) };
    }
    if (roll && roll.shotFrom === null) return { month: "0", year: "old" };
    const now = vnNowMonthYear();
    return { month: String(now.month), year: String(now.year) };
  })();
  const [pastMonth, setPastMonth] = useState(initialMonthYear.month);
  const [pastYear, setPastYear] = useState(initialMonthYear.year);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formOpenedAtRef = useRef<number | null>(null);
  const openedTrackedRef = useRef(false);

  useEffect(() => {
    if (openedTrackedRef.current) return;
    openedTrackedRef.current = true;
    formOpenedAtRef.current = Date.now();
    if (!isEdit) posthog.capture("roll_form_opened", { mode });
  }, [mode, isEdit]);

  useEffect(() => {
    let cancelled = false;
    listBag().then((entries) => {
      if (!cancelled) setBagEntries(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // N1: the header kicker and the name field's "Để trống thì gọi là Cuộn
  // #N" hint — skipped entirely in edit mode, which already has the
  // roll's real number from `roll.number`.
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    getNextRollNumber().then((n) => {
      if (!cancelled) setNextNumber(n);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  // N3 (new mode) / P2 (past mode): the inline catalogue search,
  // debounced ~200ms, capped at 5 hits (`QUICK_ADD_LIMIT`) with a link to
  // the full `CataloguePicker` dialog for the rest.
  useEffect(() => {
    const timer = setTimeout(() => setQuickAddDebounced(quickAddQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [quickAddQuery]);

  useEffect(() => {
    // An empty query never searches: nothing to synchronise — the render
    // below only shows results once `quickAddResultsQuery` matches a
    // non-empty `quickAddDebounced`, so any stale results just sit unused
    // (same pattern as `CataloguePicker`'s own debounced search).
    if (quickAddDebounced === "") return;
    const thisRequest = ++quickAddRequestId.current;
    searchCatalogue({ kind: "stock", q: quickAddDebounced }).then((result) => {
      if (thisRequest !== quickAddRequestId.current) return;
      setQuickAddResults(result.ok ? result.entries : []);
      setQuickAddResultsQuery(quickAddDebounced);
    });
  }, [quickAddDebounced]);

  const { stocks: bagStocks, cameras: bagCameras, lenses: bagLenses } = useMemo(
    () => splitBag(bagEntries ?? []),
    [bagEntries],
  );

  // N3/N4: the chip list also carries a just-picked-but-not-yet-bagged
  // stock (tagged "mới"), when it isn't already one of the bag's own.
  const filmChips = useMemo(() => {
    if (!pendingNewStock) return bagStocks.map((entry) => ({ ...entry, isNew: false }));
    if (bagStocks.some((entry) => entry.stock.id === pendingNewStock.id)) {
      return bagStocks.map((entry) => ({ ...entry, isNew: false }));
    }
    return [...bagStocks.map((entry) => ({ ...entry, isNew: false })), { stock: pendingNewStock, qty: undefined, isNew: true }];
  }, [bagStocks, pendingNewStock]);

  // D3: bag first — an explicit pick wins, otherwise the first bag item is
  // the default. Computed during render (no effect, no cascading
  // setState) so it always reflects the latest bag without a render lag.
  const selectedCameraBagItemId = explicitCameraBagItemId ?? bagCameras[0]?.bagItemId ?? null;
  const selectedCamera = bagCameras.find((entry) => entry.bagItemId === selectedCameraBagItemId) ?? null;
  // D20: a single-use camera's film is fixed — the stock picker locks to it.
  const lockedStock = selectedCamera?.fixedStock ?? null;
  const selectedStockId = lockedStock ? lockedStock.id : (explicitStockId ?? filmChips[0]?.stock.id ?? null);
  const effectiveStockId = selectedStockId;
  const selectedChip = lockedStock ? null : filmChips.find((entry) => entry.stock.id === selectedStockId) ?? null;
  const selectedStock = lockedStock ?? selectedChip?.stock ?? null;
  const selectedStockQty = selectedChip?.qty;

  const boxIso = boxIsoOverride ?? (selectedStock?.iso != null ? String(selectedStock.iso) : "");
  const boxIsoNumber = boxIso.trim() === "" ? null : Number(boxIso);
  const shotIsoNumber = shotIso.trim() === "" ? null : Number(shotIso);
  const pushPullValue = pushPullStops(boxIsoNumber, shotIsoNumber);
  const pushPull = formatPushPull(pushPullValue);
  const pushPullWarn = pushPullValue !== null && Math.abs(pushPullValue) >= 3;
  const pushPullWord =
    pushPullValue === null ? t("pushPullWordNone") : pushPullValue === 0 ? t("pushPullWordEven") : t(pushPullValue > 0 ? "pushPullWordPush" : "pushPullWordPull");

  // Owner feedback: format defaults to 35mm; exposures defaults to 36 —
  // but if the selected stock only comes in 120, format defaults to 120
  // and exposures defaults to 12 instead (N10). Both stay editable (the
  // `format`/`exposuresOverride` state above wins once picked directly).
  const stockFormats = selectedStock?.formats ?? [];
  const stockOnly120 = stockFormats.length > 0 && stockFormats.every((value) => value === "120");
  const defaultFormat: TFormat = stockOnly120 ? "120" : "35mm";
  const effectiveFormat = format ?? defaultFormat;
  const defaultExposures = effectiveFormat === "35mm" ? "36" : "12";
  const exposures = exposuresOverride ?? defaultExposures;

  async function refreshBag(): Promise<TBagEntry[]> {
    const entries = await listBag();
    setBagEntries(entries);
    return entries;
  }

  function closeDialog() {
    setDialog({ view: "closed" });
  }

  function closeQuickAdd() {
    setQuickAddOpen(false);
    setQuickAddQuery("");
  }

  /** N3/N4: picking a hit from the inline search — already-bagged stocks select straight away; anything else becomes the pending "mới" chip. */
  function pickQuickAddStock(entry: TCatalogueEntry) {
    if (entry.kind !== "stock") return;
    const alreadyBagged = bagStocks.some((chip) => chip.stock.id === entry.id);
    setExplicitStockId(entry.id);
    setBoxIsoOverride(null);
    setPendingNewStock(alreadyBagged ? null : entry);
    setAddPendingToBag(true);
    closeQuickAdd();
  }

  async function handlePicked(entry: TCatalogueEntry) {
    const entries = await refreshBag();
    if (entry.kind === "stock") {
      setExplicitStockId(entry.id);
      setPendingNewStock(null);
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
      setPendingNewStock(null);
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

  /** R2-4: resolves the single "Chụp khoảng khi nào" pick — `null` for "Không nhớ" (month `"0"`) or "Lâu hơn nữa" (year `"old"`). */
  function resolvePastMonthYear(): { month: number; year: number } | null {
    if (pastMonth === "0" || pastYear === "old") return null;
    return { month: Number(pastMonth), year: Number(pastYear) };
  }

  async function handleSave() {
    setFormError(null);
    if (!effectiveStockId || !selectedCameraBagItemId) return;

    setSaving(true);

    const shared = {
      stockId: effectiveStockId,
      cameraBagItemId: selectedCameraBagItemId,
      lensId: selectedLensId ?? undefined,
      name: name.trim() || undefined,
      boxIso: boxIsoNumber ?? undefined,
      shotIso: shotIsoNumber ?? undefined,
      exposures: exposures.trim() ? Number(exposures) : undefined,
      format: effectiveFormat,
      locations: locations.length > 0 ? locations : undefined,
    };

    if (isEdit) {
      const monthYear = mode === "past" ? resolvePastMonthYear() : null;
      const result = await updateRoll({
        rollId: roll.id,
        expectedVersion: roll.version,
        ...shared,
        ...(mode === "past"
          ? { shotFromMonth: monthYear, shotToMonth: monthYear }
          : {
              shotFrom: parseVnDateInput(loadDateInput),
              shotTo: parseVnDateInput(finishDateInput),
            }),
      });
      setSaving(false);
      if (result.ok) {
        router.push(`/rolls/${roll.id}`);
      } else {
        setFormError(result.error === "stale_version" ? t("errorStale") : t("errorGeneric"));
      }
      return;
    }

    const monthYear = mode === "past" ? resolvePastMonthYear() : null;
    const result = await createRoll({
      mode,
      ...shared,
      ...(mode === "past"
        ? { shotFromMonth: monthYear, shotToMonth: monthYear }
        : {
            shotFrom: parseVnDateInput(loadDateInput),
            shotTo: parseVnDateInput(finishDateInput),
          }),
      addStockToBag: pendingNewStock ? addPendingToBag : undefined,
      formOpenedAt: formOpenedAtRef.current ?? undefined,
    });
    setSaving(false);

    if (result.ok) {
      router.push(`/rolls/${result.rollId}?saved=1`);
    } else {
      setFormError(t("errorGeneric"));
    }
  }

  // ROLL-1 (owner 28.09.2026): box ISO is required — prefilled from the
  // film, so it only blocks Save when the film has no ISO or it's cleared.
  const boxIsoValid = boxIsoNumber !== null && Number.isInteger(boxIsoNumber) && boxIsoNumber > 0;
  const canSave = effectiveStockId !== null && selectedCameraBagItemId !== null && boxIsoValid && !saving;

  // D3/D14: the calendar itself blocks what the server would reject
  // anyway — a future day (Vietnam calendar). Only relevant to the new-
  // mode optional day pickers (N7); past mode uses month/year selects.
  function isDisabledFutureVnDay(date: Date): boolean {
    const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    return toVnDateString(ms) > toVnDateString(Date.now());
  }

  const closeHref = isEdit ? `/rolls/${roll.id}` : "/";
  const kickerNumber = isEdit ? (roll?.number ?? null) : nextNumber;
  const heading = isEdit ? t("editHeading") : t(mode === "past" ? "pastHeading" : "newHeading");
  const lead = isEdit ? t("editLead") : t(mode === "past" ? "pastLead" : "newLead");
  const saveLabel = isEdit ? t("saveEdit") : t(mode === "past" ? "savePast" : "saveNew");

  const summary = [selectedStock ? `${selectedStock.brand} ${selectedStock.name}` : null, selectedCamera ? `${selectedCamera.camera.brand} ${selectedCamera.camera.model}` : null, shotIso || boxIso ? `ISO ${shotIso || boxIso}` : null]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  // N12 (desktop): the same `IRollEntry` → `RollCardProps` mapping Home
  // uses (`roll-card-mapper.ts`), fed with the form's own live values —
  // "Sẽ lên kệ thế này" is a preview of exactly what `RollCard` will show
  // once this roll is actually on the shelf, "Cuộn #N" and all.
  const previewMonthYear = mode === "past" ? resolvePastMonthYear() : null;
  const previewShotFrom =
    mode === "past"
      ? (previewMonthYear ? vnMonthStart(previewMonthYear.month, previewMonthYear.year) : null)
      : (() => {
          const ms = parseVnDateInput(loadDateInput);
          return ms !== undefined ? new Date(ms) : null;
        })();
  const previewShotTo =
    mode === "past"
      ? (previewMonthYear ? vnMonthEnd(previewMonthYear.month, previewMonthYear.year) : null)
      : (() => {
          const ms = parseVnDateInput(finishDateInput);
          return ms !== undefined ? new Date(ms) : null;
        })();
  const previewDatePrecision: "day" | "month" | null = mode === "past" ? (previewMonthYear ? "month" : null) : previewShotFrom ? "day" : null;

  const previewRoll: IRollEntry = {
    id: "preview",
    number: kickerNumber,
    name: name.trim() || null,
    canisterColor: selectedStock?.canisterColor ?? null,
    boxIso: boxIsoNumber,
    shotIso: shotIsoNumber,
    exposures: exposures.trim() ? Number(exposures) : null,
    format: effectiveFormat,
    locations: locations.length > 0 ? locations : null,
    shotFrom: previewShotFrom,
    shotTo: previewShotTo,
    datePrecision: previewDatePrecision,
    notes: null,
    memory: null,
    version: 1,
    createdAt: new Date(),
    pushPull,
    stock: selectedStock
      ? { id: selectedStock.id, brand: selectedStock.brand, name: selectedStock.name, iso: selectedStock.iso, canisterColor: selectedStock.canisterColor, type: selectedStock.type }
      : null,
    camera: selectedCamera ? { brand: selectedCamera.camera.brand, model: selectedCamera.camera.model, type: selectedCamera.camera.type } : null,
    lens: null,
  };
  const previewCardProps = toRollCardProps(previewRoll, {
    unnamedRollLabel: kickerNumber !== null ? tPage("titleFallback", { number: kickerNumber }) : undefined,
  });

  const now = vnNowMonthYear();
  const yearOptions = Array.from({ length: YEAR_WINDOW + 1 }, (_, i) => now.year - i);

  function renderQuickAddResults(query: string) {
    const hits = quickAddResultsQuery === query ? quickAddResults.slice(0, QUICK_ADD_LIMIT) : [];
    const searched = quickAddResultsQuery === query;
    const hasMore = searched && quickAddResults.length > QUICK_ADD_LIMIT;
    const noMatch = searched && quickAddResults.length === 0;

    return (
      <>
        {hits.length > 0 ? (
          <ul className={styles.qaList} aria-label={tPicker("title")}>
            {hits.map((hit) => {
              if (hit.kind !== "stock") return null;
              const typeKey = stockTypeLabelKey(hit.type);
              const inBag = bagStocks.some((chip) => chip.stock.id === hit.id);
              // Board fidelity (`NewRoll`'s `.qa-row`, N3): the row's name
              // is the stock name alone, brand only in the meta line —
              // same convention C3 (W3) applies to `CataloguePicker`'s
              // rows.
              const label = hit.name;
              return (
                <li key={hit.id}>
                  <button type="button" className={styles.qaRow} onClick={() => pickQuickAddStock(hit)}>
                    <CanisterChipSwatch color={hit.canisterColor} />
                    <span className={styles.qaRowText}>
                      <span className={styles.qaRowName}>{label}</span>
                      <span className={styles.qaRowMeta}>
                        {hit.iso != null ? `ISO ${hit.iso} · ` : ""}
                        {hit.brand}
                        {typeKey ? ` · ${tTypes(typeKey)}` : ""}
                      </span>
                    </span>
                    <span className={styles.qaRowAction}>{inBag ? tPicker("inBag") : t("quickAddPick")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {hasMore ? (
          <button type="button" className={styles.qaLink} onClick={() => setDialog({ view: "picker", kind: "stock" })}>
            {t("quickAddMore", { count: quickAddResults.length })}
          </button>
        ) : null}
        {noMatch ? (
          <div className={styles.qaEmpty}>
            <span className={styles.qaEmptyTitle}>{t("quickAddEmptyTitle", { query })}</span>
            <span className={styles.qaEmptyBody}>{t("quickAddEmptyBody")}</span>
            <button type="button" className={styles.qaLink} onClick={() => setDialog({ view: "custom", kind: "stock", query })}>
              {t("quickAddAddCustom")}
            </button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {kickerNumber !== null ? <span className={styles.kicker}>{t("kicker", { number: kickerNumber })}</span> : <span />}
        <CloseLink href={closeHref} label={t("closeAria")} />
      </div>

      <Link href={closeHref} className={styles.backDesktop}>
        {t("backDesktop")}
      </Link>

      <div className={styles.layout}>
      <div className={styles.body}>
        <div className={styles.titleRow}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{heading}</h1>
          <p className={styles.lead}>{lead}</p>
        </div>

        {!isEdit ? (
          // Owner 30.09.2026 (PastRoll board comment): one "Đã chụp xong"
          // checkbox instead of the two-way toggle. Each mode is its own URL,
          // so ticking it navigates, as the toggle's links did.
          <label className={styles.pastCheck}>
            <input
              type="checkbox"
              checked={mode === "past"}
              onChange={(event) => router.push(event.target.checked ? "/rolls/new?mode=past" : "/rolls/new")}
            />
            <span>{t("modePast")}</span>
          </label>
        ) : null}
        </div>

        {/* NewRollWeb: film and camera side by side at desktop. */}
        <div className={styles.pickers}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legendRow}>
            <span className={styles.legendLabel}>{t("filmLegend")}</span>
            <span className={styles.required}>{t("required")}</span>
          </legend>

          {mode === "past" ? (
            <div className={styles.field}>
              <Field
                label={tPicker("searchLabel")}
                hint={t("quickAddSearchHintPast")}
                type="search"
                placeholder={t("quickAddSearchPlaceholder")}
                value={quickAddQuery}
                onChange={(event) => setQuickAddQuery(event.target.value)}
              />
              {quickAddQuery.trim() === "" ? (
                bagEntries === null ? (
                  <p className={styles.hint}>{t("loadingBag")}</p>
                ) : filmChips.length === 0 && !lockedStock ? (
                  <p className={styles.hint}>{t("emptyBagStock")}</p>
                ) : (
                  <>
                    <span className={styles.required}>{t("pastQuickPicksLabel")}</span>
                    <div className={styles.chips}>
                      {filmChips.map(({ stock: stockRow, isNew }) => {
                        const typeKey = stockTypeLabelKey(stockRow.type);
                        return (
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
                              {stockRow.name}
                              {/* C3: the stock name alone, brand moved into the meta — same convention as `CataloguePicker`'s rows. */}
                              <span className={styles.chipMeta}> · {[stockRow.brand, typeKey ? tTypes(typeKey) : null].filter(Boolean).join(" · ")}</span>
                            </span>
                            {isNew ? <span className={styles.newtag}>{t("quickAddNewTag")}</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  </>
                )
              ) : (
                renderQuickAddResults(quickAddDebounced)
              )}
            </div>
          ) : (
            <>
              {bagEntries === null ? (
                <p className={styles.hint}>{t("loadingBag")}</p>
              ) : (
                <>
                  {filmChips.length === 0 && !lockedStock ? (
                    <p className={styles.hint}>{t("emptyBagStock")}</p>
                  ) : (
                    <div className={styles.chips}>
                      {filmChips.map(({ stock: stockRow, qty, isNew }) => {
                        const typeKey = stockTypeLabelKey(stockRow.type);
                        const qtyTxt = qty === undefined || qty === null ? null : qty > 0 ? `×${qty}` : t("chipEmpty");
                        return (
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
                              {stockRow.name}
                              <span className={styles.chipMeta}> · {[stockRow.brand, typeKey ? tTypes(typeKey) : null].filter(Boolean).join(" · ")}</span>
                            </span>
                            {qtyTxt ? <span className={styles.qty}>{qtyTxt}</span> : null}
                            {isNew ? <span className={styles.newtag}>{t("quickAddNewTag")}</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.chipAdd}
                    aria-expanded={quickAddOpen}
                    aria-controls="roll-form-quick-add"
                    onClick={() => setQuickAddOpen((prev) => !prev)}
                    disabled={lockedStock !== null}
                  >
                    {t("addStock")}
                  </button>
                </>
              )}

              {quickAddOpen ? (
                <div id="roll-form-quick-add" className={styles.qa}>
                  <Field
                    label={tPicker("searchLabel")}
                    hint={t("quickAddSearchHintNew")}
                    type="search"
                    placeholder={t("quickAddSearchPlaceholder")}
                    value={quickAddQuery}
                    onChange={(event) => setQuickAddQuery(event.target.value)}
                  />
                  {quickAddQuery.trim() !== "" ? renderQuickAddResults(quickAddDebounced) : null}
                  <button type="button" className={styles.qaCancel} onClick={closeQuickAdd}>
                    {t("quickAddCancel")}
                  </button>
                </div>
              ) : null}
            </>
          )}

          {lockedStock ? <p className={styles.fieldHint}>{t("fixedFilmHint", { name: `${lockedStock.brand} ${lockedStock.name}` })}</p> : null}

          {pendingNewStock ? (
            <label className={styles.addToBagRow}>
              <input type="checkbox" checked={addPendingToBag} onChange={(event) => setAddPendingToBag(event.target.checked)} />
              {/* Board fidelity: `filmName` in the checkbox copy is the stock name alone (N4). */}
              <span>{t("addToBagCheckbox", { name: pendingNewStock.name })}</span>
            </label>
          ) : null}

          {selectedStock ? (
            <span className={styles.mono}>
              {mode === "past"
                ? t("pastFilmPicked", { name: `${selectedStock.brand} ${selectedStock.name}`, iso: boxIso || "—" })
                : t("stockLineIso", { iso: boxIso || "—" }) +
                  (selectedStockQty === undefined || selectedStockQty === null
                    ? ""
                    : selectedStockQty > 0
                      ? t("stockLineRemaining", { qty: selectedStockQty - 1 })
                      : t("stockLineEmpty"))}
            </span>
          ) : null}
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
              {bagCameras.map(({ camera, bagItemId }) => {
                const typeKey = cameraTypeLabelKey(camera.type);
                return (
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
                      {typeKey ? <span className={styles.chipMeta}> · {tTypes(typeKey)}</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <button type="button" className={styles.chipAdd} onClick={() => setDialog({ view: "picker", kind: "camera" })}>
            {t("addCamera")}
          </button>
        </fieldset>
        </div>

        {/* ROLL-1 (owner 28.09.2026): format and box ISO are required, always
            prefilled — format from the stock (N10), box ISO from its ISO. */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legendRow}>
            <span className={styles.legendLabel}>{t("essentialsLegend")}</span>
            <span className={styles.required}>{t("required")}</span>
          </legend>
          <div className={styles.two}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>{t("formatLabel")}</span>
              <div className={styles.seg} role="group" aria-label={t("formatLabel")}>
                {FORMATS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={effectiveFormat === value}
                    onClick={() => {
                      setFormat(value);
                      setExposuresOverride(value === "35mm" ? "36" : "12");
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label={t("boxIsoLabel")}
              mono
              inputMode="numeric"
              required
              value={boxIso}
              onChange={(event) => {
                setBoxIsoOverride(event.target.value);
              }}
            />
          </div>
          {!boxIsoValid && effectiveStockId !== null ? <p className={styles.fieldHint}>{t("boxIsoRequired")}</p> : null}
        </fieldset>

        {mode === "past" ? (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legendLabel}>{t("monthLegend")}</legend>
            <div className={styles.two}>
              <div className={styles.field}>
                <label className={styles.srOnly} htmlFor="roll-form-month">
                  {t("monthSrLabel")}
                </label>
                <select id="roll-form-month" className={styles.select} value={pastMonth} onChange={(event) => setPastMonth(event.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {t("monthPlaceholder", { month: m })}
                    </option>
                  ))}
                  <option value="0">{t("monthNone")}</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.srOnly} htmlFor="roll-form-year">
                  {t("yearSrLabel")}
                </label>
                <select id="roll-form-year" className={styles.select} value={pastYear} onChange={(event) => setPastYear(event.target.value)}>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                  <option value="old">{t("yearOlder")}</option>
                </select>
              </div>
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
            <Field label={t("nameLabel")} placeholder={t("namePlaceholder")} value={name} onChange={(event) => setName(event.target.value)} hint={kickerNumber !== null ? t("nameHint", { number: kickerNumber }) : undefined} />

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
              <Field
                label={t("exposuresLabel")}
                mono
                inputMode="numeric"
                value={exposures}
                onChange={(event) => setExposuresOverride(event.target.value)}
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

            <div className={styles.pushPull} aria-live="polite">
              <span className={styles.legendLabel}>{t("pushPullLabel")}</span>
              <b>{pushPull ?? "—"}</b>
              <span className={styles.pushPullWord}>{pushPullWord}</span>
            </div>
            {pushPullWarn ? <p className={styles.pushPullWarning}>{t("pushPullWarning", { pp: pushPull ?? "" })}</p> : null}

            {mode === "new" ? (
              <div className={styles.two}>
                <DatePicker label={t("loadDateLabel")} value={loadDateInput} onChange={setLoadDateInput} disabled={isDisabledFutureVnDay} />
                <DatePicker label={t("finishDateLabel")} value={finishDateInput} onChange={setFinishDateInput} disabled={isDisabledFutureVnDay} />
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
              <p className={styles.fieldHint}>{t("locationsHint")}</p>
            </div>
          </div>
        ) : null}

        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}

        <div className={styles.footerSpacer} />
      </div>

      {/* N12 (desktop only): the real `RollCard`, live from the form's own values. */}
      {/* NewRollWeb: the desktop side panel holds the preview and the save
          actions; on phone it dissolves (`display: contents`) so the footer
          stays the sticky save bar. */}
      <div className={styles.side}>
      <div className={styles.preview} aria-hidden="true">
        <div className={styles.previewHead}>
          <span className={styles.previewHeading}>{t("previewHeading")}</span>
          {kickerNumber !== null ? <span className={styles.kicker}>{t("kicker", { number: kickerNumber })}</span> : null}
        </div>
        <RollCard {...previewCardProps} href={undefined} className={styles.previewCard} />
        <span className={styles.previewScribble}>
          <Scribble arrow="left" size="sm">
            {t("previewScribble")}
          </Scribble>
        </span>
      </div>

      <div className={styles.footer}>
        {summary ? <span className={styles.summary}>{summary}</span> : null}
        <div className={styles.footerActions}>
          <button type="button" className={styles.save} disabled={!canSave} onClick={handleSave}>
            {saveLabel}
          </button>
          <Link href={closeHref} className={styles.cancelDesktop}>
            {t("cancelDesktop")}
          </Link>
        </div>
      </div>
      </div>
      </div>

      <ResponsiveDialog open={dialog.view !== "closed"} onClose={closeDialog} labelledBy={titleId}>
        {dialog.view === "picker" ? (
          <CataloguePicker
            titleId={titleId}
            initialKind={dialog.kind}
            onPicked={handlePicked}
            onAddCustom={(kind, query) => setDialog({ view: "custom", kind, query })}
            onClose={closeDialog}
          />
        ) : dialog.view === "custom" ? (
          <CustomEntryForm titleId={titleId} initialKind={dialog.kind} initialQuery={dialog.query} onCreated={handleCreated} onClose={closeDialog} />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
