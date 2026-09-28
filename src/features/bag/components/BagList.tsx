"use client";

import { useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, Stamp } from "@/design-system";
import { DialogCloseButton } from "@/components/overlay/DialogCloseButton";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { listBag, removeFromBag } from "@/features/bag/actions";
import { BagCanisterStrip } from "@/features/bag/components/BagCanisterStrip";
import { ExpiryYearField } from "@/features/bag/components/ExpiryYearField";
import { StockQtyEdit } from "@/features/bag/components/StockQtyEdit";
import { summarizeBag, type TBagEntry } from "@/features/bag/queries";
import { CataloguePicker } from "@/features/catalogue/components/CataloguePicker";
import { CustomEntryForm, type TCustomEntryKind } from "@/features/catalogue/components/CustomEntryForm";
import { cameraFormatLabelKey, cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import type { TCatalogueKind } from "@/features/catalogue/queries";
import styles from "./BagList.module.css";

type TDialogMode =
  | { view: "closed" }
  | { view: "picker"; kind: TCatalogueKind }
  // `fromPicker` (E5): whether this custom form was opened from the
  // picker's "không thấy?" flow — if so, its back button returns there
  // instead of closing the whole dialog.
  | { view: "custom"; kind: TCustomEntryKind; query?: string; fromPicker?: boolean };

export interface BagListProps {
  initialEntries: TBagEntry[];
}

function entryRefId(entry: TBagEntry): string {
  if (entry.kind === "stock") return entry.stock.id;
  if (entry.kind === "camera") return entry.camera.id;
  return entry.lens.id;
}

function entryName(entry: TBagEntry): string {
  if (entry.kind === "stock") return `${entry.stock.brand} ${entry.stock.name}`;
  if (entry.kind === "camera") return `${entry.camera.brand} ${entry.camera.model}`;
  return entry.lens.model ? `${entry.lens.brand} ${entry.lens.model}` : entry.lens.brand;
}

function isCustom(entry: TBagEntry): boolean {
  if (entry.kind === "stock") return entry.stock.ownerId !== null;
  if (entry.kind === "camera") return entry.camera.ownerId !== null;
  return true; // D3: lens is always the owner's own entry
}

function joinMeta(parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

/** The board's `.can-sm`: a small canister capsule, coloured by `stock.canisterColor`. */
function CanisterSwatch({ color }: { color: string | null }) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;
  return <span className={styles.canSm} style={style} aria-hidden="true" />;
}

/** The board's lens icon: no `Icon` name covers it, so it's inline like `note`/`camera` there. */
function LensIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3.5v3M20.5 12h-3" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * D2 (BAG-1): `Profile`'s "Túi của tôi" list plus `OnboardBag`'s picker, in
 * one client component so add/remove/undo update `entries` in place — no
 * navigation, no full reload (D2's brief). Sections are grouped by
 * `bag_item.kind` (design finding 1: the boards only needed a lens
 * section added). Round 2 (BAG-2/BAG-3, audit B1–B5, B7, B8): the
 * canister strip, the per-stock qty stepper and expiry year, and the
 * "N CUỘN" / "ĐÃ CHỤP N CUỘN" counts, all sourced from `listBag`'s
 * `qty`/`expiryYear`/`rollsShot` and `summarizeBag(entries)`.
 */
export function BagList({ initialEntries }: BagListProps) {
  const t = useTranslations("bag");
  const tTypes = useTranslations("catalogue.types");
  const typeLabel = (key: Parameters<typeof tTypes>[0] | null) => (key ? tTypes(key) : null);
  const dialogTitleId = useId();
  const confirmTitleId = useId();
  const [entries, setEntries] = useState<TBagEntry[]>(initialEntries);
  const [dialog, setDialog] = useState<TDialogMode>({ view: "closed" });
  const [confirmEntry, setConfirmEntry] = useState<TBagEntry | null>(null);
  const [removing, setRemoving] = useState(false);
  const sectionsRef = useRef<HTMLDivElement>(null);

  const bagRefIds = useMemo(
    () => new Set(entries.map((entry) => `${entry.kind}:${entryRefId(entry)}`)),
    [entries],
  );

  // BAG-2 (N6): the catalogue picker's "×N"/"hết" chips for a stock already in this bag.
  const bagQtyByKey = useMemo(
    () =>
      new Map(
        entries.filter((entry) => entry.kind === "stock").map((entry) => [`stock:${entry.stock.id}`, entry.qty ?? null]),
      ),
    [entries],
  );

  // BAG-2 (R2-2/R2-3): the counts line, film heading, and canister strip
  // all come from the same pure summary over `entries` — no extra fetch.
  const summary = useMemo(() => summarizeBag(entries), [entries]);

  /** Patches one stock bag item's qty/expiryYear in place, after the server confirms the change. */
  function updateStockEntry(bagItemId: string, patch: Partial<{ qty: number | null; expiryYear: number | null }>) {
    // Owner 28.09.2026: a count saved as 0 took the film out of the bag.
    if (patch.qty === 0) {
      setEntries((prev) => prev.filter((entry) => entry.bagItemId !== bagItemId));
      return;
    }
    setEntries((prev) =>
      prev.map((entry) =>
        entry.kind === "stock" && entry.bagItemId === bagItemId ? { ...entry, ...patch } : entry,
      ),
    );
  }

  async function refresh() {
    setEntries(await listBag());
  }

  function closeDialog() {
    setDialog({ view: "closed" });
  }

  function openPicker(kind: TCatalogueKind) {
    setDialog({ view: "picker", kind });
  }

  function openCustomLens() {
    setDialog({ view: "custom", kind: "lens" });
  }

  async function handlePicked() {
    await refresh();
    closeDialog();
  }

  async function handleCreated() {
    await refresh();
    closeDialog();
  }

  /**
   * Fix 3 (owner review): removing an item opens a confirm dialog naming
   * it, rather than removing straight away with an undo toast — the
   * confirm replaces the undo, so there's no second safety net to keep in
   * sync with it.
   */
  function closeConfirm() {
    setConfirmEntry(null);
    // Focus returns to the list, not the trigger button — the item (and
    // its button) that opened this dialog may no longer exist once a
    // remove actually goes through.
    sectionsRef.current?.focus();
  }

  async function handleConfirmRemove() {
    if (!confirmEntry) return;

    setRemoving(true);
    const result = await removeFromBag({ bagItemId: confirmEntry.bagItemId });
    setRemoving(false);
    if (!result.ok) return;

    setEntries((prev) => prev.filter((item) => item.bagItemId !== confirmEntry.bagItemId));
    closeConfirm();
  }

  const films = entries.filter((entry) => entry.kind === "stock");
  const cameras = entries.filter((entry) => entry.kind === "camera");
  const lenses = entries.filter((entry) => entry.kind === "lens");
  const isEmpty = entries.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* B9 (audit, BagWeb): title + counts + the canister pocket on the
          left, search in a 380px right column at desktop; stacked (search
          below) on phone. */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-display-l font-semibold">{t("title")}</h1>
          <p className={styles.countsLine}>
            {t("countsLine", {
              rolls: summary.unloadedRolls,
              films: films.length,
              cameras: cameras.length,
              lenses: lenses.length,
            })}
          </p>
        </div>
        <BagCanisterStrip canisters={summary.canisters} unloadedRolls={summary.unloadedRolls} />
        </div>

        {!isEmpty ? (
          <div className={styles.headerSearch}>
            <button type="button" className={styles.search} onClick={() => openPicker("stock")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <span>{t("searchPrompt")}</span>
            </button>
          </div>
        ) : null}
      </div>


      {isEmpty ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("emptyTitle")}</p>
          <p className={styles.emptyBody}>{t("emptyBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => openPicker("camera")}>
              {t("emptyAddCamera")}
            </Button>
            <Button variant="outline" onClick={() => openPicker("stock")}>
              {t("emptyAddFilm")}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.sections} ref={sectionsRef} tabIndex={-1}>
          <section aria-labelledby="bag-film-heading" className="flex flex-col gap-2">
            <h2 id="bag-film-heading" className={styles.sectionHeading}>
              {t("sectionFilmWithRolls", { count: films.length, rolls: summary.unloadedRolls })}
            </h2>
            <ul className={styles.list}>
              {films.map((entry) => {
                const rollsShot = entry.rollsShot ?? 0;
                return (
                  <li key={entry.bagItemId} className={`${styles.item} ${styles.filmItem}`}>
                    <span className={styles.itemIcon}>
                      <CanisterSwatch color={entry.stock.canisterColor} />
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemName}>
                        {entryName(entry)}
                        {isCustom(entry) ? <Stamp tone="ink">{t("own")}</Stamp> : null}
                      </span>
                      <span className={styles.itemMeta}>
                        {joinMeta([
                          entry.stock.iso != null && `ISO ${entry.stock.iso}`,
                          typeLabel(stockTypeLabelKey(entry.stock.type)),
                          entry.stock.formats?.join(", "),
                        ])}
                      </span>
                      <span className={styles.itemMeta}>
                        {rollsShot > 0 ? t("rollsShotFilm", { count: rollsShot }) : t("rollsShotFilmZero")}
                      </span>
                      <ExpiryYearField
                        bagItemId={entry.bagItemId}
                        expiryYear={entry.expiryYear ?? null}
                        onChange={(expiryYear) => updateStockEntry(entry.bagItemId, { expiryYear })}
                      />
                    </span>
                    <StockQtyEdit
                      bagItemId={entry.bagItemId}
                      qty={entry.qty ?? null}
                      stockName={entryName(entry)}
                      onChange={(qty) => updateStockEntry(entry.bagItemId, { qty })}
                      onRemove={() => updateStockEntry(entry.bagItemId, { qty: 0 })}
                    />
                  </li>
                );
              })}
            </ul>
            <button type="button" className={styles.addLink} onClick={() => openPicker("stock")}>
              <Icon name="film" size={18} />
              {t("addFilm")}
            </button>
          </section>

          <section aria-labelledby="bag-camera-heading" className="flex flex-col gap-2">
            <h2 id="bag-camera-heading" className={styles.sectionHeading}>
              {t("sectionCamera", { count: cameras.length })}
            </h2>
            <ul className={styles.list}>
              {cameras.map((entry) => (
                <li key={entry.bagItemId} className={styles.item}>
                  <span className={styles.itemIcon}>
                    <Icon name="camera" size={18} />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>
                      {entryName(entry)}
                      {isCustom(entry) ? <Stamp tone="ink">{t("own")}</Stamp> : null}
                    </span>
                    <span className={styles.itemMeta}>
                      {joinMeta([
                        typeLabel(cameraTypeLabelKey(entry.camera.type)),
                        typeLabel(cameraFormatLabelKey(entry.camera.format)) ?? entry.camera.format,
                      ])}
                    </span>
                    {entry.fixedStock ? (
                      <span className={styles.itemMeta}>
                        {t("fixedStockNote", { name: `${entry.fixedStock.brand} ${entry.fixedStock.name}` })}
                      </span>
                    ) : null}
                    <span className={styles.itemMeta}>{t("rollsShotCamera", { count: entry.rollsShot ?? 0 })}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t("removeLabel", { name: entryName(entry) })}
                    onClick={() => setConfirmEntry(entry)}
                    disabled={removing && confirmEntry?.bagItemId === entry.bagItemId}
                  >
                    <RemoveIcon />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.addLink} onClick={() => openPicker("camera")}>
              <Icon name="camera" size={18} />
              {t("addCamera")}
            </button>
          </section>

          <section aria-labelledby="bag-lens-heading" className="flex flex-col gap-2">
            <div className={styles.sectionHeadingRow}>
              <h2 id="bag-lens-heading" className={styles.sectionHeading}>
                {t("sectionLens", { count: lenses.length })}
              </h2>
              <span className={styles.sectionHeadingHint}>{t("sectionLensHint")}</span>
            </div>
            <ul className={styles.list}>
              {lenses.map((entry) => (
                <li key={entry.bagItemId} className={styles.item}>
                  <span className={styles.itemIcon}>
                    <LensIcon />
                  </span>
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>
                      {entryName(entry)}
                      <Stamp tone="ink">{t("own")}</Stamp>
                    </span>
                    <span className={styles.itemMeta}>
                      {joinMeta([entry.lens.focalLength ? `${entry.lens.focalLength}mm` : null])}
                    </span>
                    <span className={styles.itemMeta}>{t("rollsShotLens", { count: entry.rollsShot ?? 0 })}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t("removeLabel", { name: entryName(entry) })}
                    onClick={() => setConfirmEntry(entry)}
                    disabled={removing && confirmEntry?.bagItemId === entry.bagItemId}
                  >
                    <RemoveIcon />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.addLink} onClick={openCustomLens}>
              <LensIcon />
              {t("addLens")}
            </button>
          </section>
        </div>
      )}

      <ResponsiveDialog open={dialog.view !== "closed"} onClose={closeDialog} labelledBy={dialogTitleId}>
        {dialog.view === "picker" ? (
          <CataloguePicker
            titleId={dialogTitleId}
            initialKind={dialog.kind}
            bagRefIds={bagRefIds}
            bagQtyByKey={bagQtyByKey}
            onPicked={handlePicked}
            onAddCustom={(kind, query) => setDialog({ view: "custom", kind, query, fromPicker: true })}
            onClose={closeDialog}
          />
        ) : dialog.view === "custom" ? (
          <CustomEntryForm
            titleId={dialogTitleId}
            initialKind={dialog.kind}
            initialQuery={dialog.query}
            onCreated={handleCreated}
            onClose={closeDialog}
            onBack={
              // `fromPicker` is only ever set by the picker's `onAddCustom`
              // (kind: TCatalogueKind), so `dialog.kind` here is never "lens".
              dialog.fromPicker && dialog.kind !== "lens"
                ? () => setDialog({ view: "picker", kind: dialog.kind as TCatalogueKind })
                : undefined
            }
          />
        ) : null}
      </ResponsiveDialog>

      <ResponsiveDialog open={confirmEntry !== null} onClose={closeConfirm} labelledBy={confirmTitleId} size="compact">
        {confirmEntry ? (
          <div className={styles.confirm}>
            <div className={styles.confirmHeader}>
              <h2 id={confirmTitleId} className={styles.confirmTitle}>
                {t("removeConfirmTitle", { name: entryName(confirmEntry) })}
              </h2>
              <DialogCloseButton onClose={closeConfirm} />
            </div>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmCancel} onClick={closeConfirm} disabled={removing}>
                {t("removeConfirmCancel")}
              </button>
              <button type="button" className={styles.confirmDanger} onClick={handleConfirmRemove} disabled={removing}>
                {t("removeConfirmConfirm")}
              </button>
            </div>
          </div>
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
