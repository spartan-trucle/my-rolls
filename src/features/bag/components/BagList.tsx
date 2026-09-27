"use client";

import { useId, useMemo, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, Stamp } from "@/design-system";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { addToBag, listBag, removeFromBag } from "@/features/bag/actions";
import type { TBagEntry } from "@/features/bag/queries";
import { CataloguePicker } from "@/features/catalogue/components/CataloguePicker";
import { CustomEntryForm, type TCustomEntryKind } from "@/features/catalogue/components/CustomEntryForm";
import { cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import type { TCatalogueKind } from "@/features/catalogue/queries";
import styles from "./BagList.module.css";

type TDialogMode =
  | { view: "closed" }
  | { view: "picker"; kind: TCatalogueKind }
  | { view: "custom"; kind: TCustomEntryKind; query?: string };

interface IRemovedItem {
  kind: TBagEntry["kind"];
  refId: string;
  name: string;
}

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
 * section added). BAG-2 (film quantities) and BAG-3 (camera roll counts)
 * aren't built: `listBag` (B4) doesn't carry that data yet.
 */
export function BagList({ initialEntries }: BagListProps) {
  const t = useTranslations("bag");
  const tTypes = useTranslations("catalogue.types");
  const typeLabel = (key: Parameters<typeof tTypes>[0] | null) => (key ? tTypes(key) : null);
  const dialogTitleId = useId();
  const [entries, setEntries] = useState<TBagEntry[]>(initialEntries);
  const [dialog, setDialog] = useState<TDialogMode>({ view: "closed" });
  const [removed, setRemoved] = useState<IRemovedItem | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const bagRefIds = useMemo(
    () => new Set(entries.map((entry) => `${entry.kind}:${entryRefId(entry)}`)),
    [entries],
  );

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

  async function handleRemove(entry: TBagEntry) {
    setPendingRemoveId(entry.bagItemId);
    const result = await removeFromBag({ bagItemId: entry.bagItemId });
    setPendingRemoveId(null);
    if (!result.ok) return;

    setEntries((prev) => prev.filter((item) => item.bagItemId !== entry.bagItemId));
    setRemoved({ kind: entry.kind, refId: entryRefId(entry), name: entryName(entry) });
  }

  /**
   * `removeFromBag` soft-deletes (D9) — there's no restore action, so
   * "undo" re-adds the same `kind` + `refId`: `addToBag` (B4) has no
   * problem creating a fresh bag item for a ref whose earlier one is now
   * soft-deleted, and to the user the film or camera just reappears.
   */
  async function handleUndo() {
    if (!removed) return;
    setUndoing(true);
    const result = await addToBag({ kind: removed.kind, refId: removed.refId });
    setUndoing(false);
    if (result.ok || result.error === "duplicate") {
      setRemoved(null);
      await refresh();
    }
  }

  const films = entries.filter((entry) => entry.kind === "stock");
  const cameras = entries.filter((entry) => entry.kind === "camera");
  const lenses = entries.filter((entry) => entry.kind === "lens");
  const isEmpty = entries.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-l font-semibold">{t("title")}</h1>
        <p className="font-mono text-meta text-ink-muted">
          {t("counts", { films: films.length, cameras: cameras.length, lenses: lenses.length })}
        </p>
      </div>

      {!isEmpty ? (
        <button type="button" className={styles.search} onClick={() => openPicker("stock")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span>{t("searchPrompt")}</span>
        </button>
      ) : null}

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
        <div className={styles.sections}>
          <section aria-labelledby="bag-film-heading" className="flex flex-col gap-2">
            <h2 id="bag-film-heading" className={styles.sectionHeading}>
              {t("sectionFilm", { count: films.length })}
            </h2>
            <ul className={styles.list}>
              {films.map((entry) => (
                <li key={entry.bagItemId} className={styles.item}>
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
                  </span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t("removeLabel", { name: entryName(entry) })}
                    onClick={() => handleRemove(entry)}
                    disabled={pendingRemoveId === entry.bagItemId}
                  >
                    <RemoveIcon />
                  </button>
                </li>
              ))}
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
                      {joinMeta([typeLabel(cameraTypeLabelKey(entry.camera.type)), entry.camera.format])}
                    </span>
                    {entry.fixedStock ? (
                      <span className={styles.itemMeta}>
                        {t("fixedStockNote", { name: `${entry.fixedStock.brand} ${entry.fixedStock.name}` })}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t("removeLabel", { name: entryName(entry) })}
                    onClick={() => handleRemove(entry)}
                    disabled={pendingRemoveId === entry.bagItemId}
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
            <h2 id="bag-lens-heading" className={styles.sectionHeading}>
              {t("sectionLens", { count: lenses.length })}
            </h2>
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
                  </span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    aria-label={t("removeLabel", { name: entryName(entry) })}
                    onClick={() => handleRemove(entry)}
                    disabled={pendingRemoveId === entry.bagItemId}
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

      {removed ? (
        <div className={styles.toast} role="status">
          <span>{t("removedToast", { name: removed.name })}</span>
          <button type="button" onClick={handleUndo} disabled={undoing}>
            {t("undo")}
          </button>
        </div>
      ) : null}

      <ResponsiveDialog open={dialog.view !== "closed"} onClose={closeDialog} labelledBy={dialogTitleId}>
        {dialog.view === "picker" ? (
          <CataloguePicker
            titleId={dialogTitleId}
            initialKind={dialog.kind}
            bagRefIds={bagRefIds}
            onPicked={handlePicked}
            onAddCustom={(kind, query) => setDialog({ view: "custom", kind, query })}
          />
        ) : dialog.view === "custom" ? (
          <CustomEntryForm
            titleId={dialogTitleId}
            initialKind={dialog.kind}
            initialQuery={dialog.query}
            onCreated={handleCreated}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}
