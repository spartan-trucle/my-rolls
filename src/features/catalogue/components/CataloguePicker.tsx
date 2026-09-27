"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Field, Icon, Scribble, Stamp } from "@/design-system";
import { cx } from "@/design-system/cx";
import { DialogCloseButton } from "@/components/overlay/DialogCloseButton";
import { addToBag } from "@/features/bag/actions";
import { listCatalogue, searchCatalogue } from "@/features/catalogue/actions";
import { cameraFormatLabelKey, cameraTypeLabelKey, stockTypeLabelKey } from "@/features/catalogue/labels";
import type { TCatalogueEntry, TCatalogueKind } from "@/features/catalogue/queries";
import styles from "./CataloguePicker.module.css";

const DEBOUNCE_MS = 200;

export interface CataloguePickerProps {
  /** "stock" (Film) by default — the kind CAT-2's "no thấy?" flow (F1) opens the picker for most. */
  initialKind?: TCatalogueKind;
  /** Composite `${kind}:${id}` keys already in the bag, so a repeat pick shows "Trong túi" from the start. */
  bagRefIds?: ReadonlySet<string>;
  /**
   * BAG-2 (R2-2, audit N6): `stock:${id}` → the bag's qty for that stock
   * (`null`/`undefined` counted as "not counted"), so a film already in
   * the bag shows "×3" or "hết" instead of the plain "Trong túi" stamp.
   * Omitted where the caller (e.g. the roll form) doesn't track quantity.
   */
  bagQtyByKey?: ReadonlyMap<string, number | null>;
  /** Fires once `addToBag` succeeds for a chosen catalogue entry. */
  onPicked: (entry: TCatalogueEntry) => void;
  /** The no-match state's action, and the results list's "không thấy?" link — opens `CustomEntryForm` prefilled with what was typed. */
  onAddCustom: (kind: TCatalogueKind, query: string) => void;
  /** The heading row's close button (the board's `.xbtn`) — omitted when there's nothing for it to call, e.g. the dev preview's own close. */
  onClose?: () => void;
  /**
   * C6 (audit, CatalogueSearchWeb/CatalogueEmptyWeb): the desktop footer's
   * secondary "‹ Quay lại cuộn" link, next to "+ Thêm film riêng" — its
   * label is caller-supplied because it names where "back" goes (the roll
   * form, the bag…), which this component doesn't know. Omitted where
   * there's nowhere to go back to (e.g. the bag, which only has close).
   */
  onGoBack?: () => void;
  backLabel?: string;
  /** id put on the `<h2>` title — pass the same id as the host `ResponsiveDialog`'s `labelledBy`. Falls back to a generated id when rendered standalone. */
  titleId?: string;
  className?: string;
}

function entryKey(kind: TCatalogueKind, id: string): string {
  return `${kind}:${id}`;
}

function joinMeta(parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

/** The board's `.can-sm`: a small canister capsule, coloured by `stock.canisterColor`. */
function CanisterSwatch({ color }: { color: string | null }) {
  const style = { "--rc-stock": `var(--stock-${color ?? "gold"})` } as CSSProperties;
  return <span className={styles.canSm} style={style} aria-hidden="true" />;
}

/**
 * D1: search the catalogue (debounced ~200ms) and pick an entry straight
 * into the bag. CAT-1's "no thấy" flow routes to `onAddCustom` rather than
 * building its own form here. Before anything is typed, the list is
 * `listCatalogue`'s own entries (D1 review's fix) rather than a bare hint —
 * the query box only takes over once there's something to search for.
 */
export function CataloguePicker({
  initialKind = "stock",
  bagRefIds,
  bagQtyByKey,
  onPicked,
  onAddCustom,
  onClose,
  onGoBack,
  backLabel,
  titleId,
  className,
}: CataloguePickerProps) {
  const t = useTranslations("catalogue.picker");
  const tTypes = useTranslations("catalogue.types");
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;
  const [kind, setKind] = useState<TCatalogueKind>(initialKind);
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState<TCatalogueEntry[]>([]);
  // The debounced query `entries` actually answers — kept separate from
  // `debouncedQuery` itself so a still-in-flight search never renders
  // stale results (or the wrong one of "results" / "no match") for a
  // query it doesn't belong to.
  const [entriesQuery, setEntriesQuery] = useState<string | null>(null);
  // `listCatalogue`'s own entries (D1 review), shown while `rawQuery` is
  // empty — kept in its own state, and its own `listKind` marker (the
  // `entriesQuery` pattern above), so a still-in-flight list fetch for a
  // kind the user has since switched away from never renders.
  const [listEntries, setListEntries] = useState<TCatalogueEntry[]>([]);
  const [listKind, setListKind] = useState<TCatalogueKind | null>(null);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set(bagRefIds ?? []));
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const requestId = useRef(0);
  const listRequestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  useEffect(() => {
    // An empty query never searches (CAT-1): nothing to synchronise, so
    // just leave any previous `entries` alone — the render below only
    // shows them once `entriesQuery` matches a non-empty `debouncedQuery`.
    if (debouncedQuery === "") return;

    const thisRequest = ++requestId.current;

    searchCatalogue({ kind, q: debouncedQuery }).then((result) => {
      if (thisRequest !== requestId.current) return; // a newer request has already landed
      setEntries(result.ok ? result.entries : []);
      setEntriesQuery(debouncedQuery);
    });
  }, [kind, debouncedQuery]);

  useEffect(() => {
    const thisRequest = ++listRequestId.current;

    listCatalogue({ kind }).then((result) => {
      if (thisRequest !== listRequestId.current) return; // a newer request has already landed
      setListEntries(result.ok ? result.entries : []);
      setListKind(kind);
    });
  }, [kind]);

  const isSearching = debouncedQuery !== "";
  const searched = isSearching && entriesQuery === debouncedQuery;
  const listed = !isSearching && listKind === kind;
  const displayEntries = isSearching ? entries : listEntries;
  const hasHits = isSearching ? searched && entries.length > 0 : listed && listEntries.length > 0;
  const noHits = isSearching && searched && entries.length === 0;

  async function handlePick(entry: TCatalogueEntry) {
    const key = entryKey(entry.kind, entry.id);
    if (addedKeys.has(key) || pendingKey === key) return;

    setPendingKey(key);
    const result = await addToBag({ kind: entry.kind, refId: entry.id });
    setPendingKey(null);

    if (result.ok || result.error === "duplicate") {
      setAddedKeys((prev) => new Set(prev).add(key));
      onPicked(entry);
    }
  }

  const noun = kind === "stock" ? "Stock" : "Camera";
  const addCustomLabel = t(kind === "stock" ? "addCustomStock" : "addCustomCamera");
  const notFoundPrompt = t(kind === "stock" ? "notFoundPromptStock" : "notFoundPromptCamera");

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.header}>
        <div className={styles.headingText}>
          <h2 id={headingId} className={styles.title}>
            {t("title")}
          </h2>
          <p className={styles.lead}>{t("lead")}</p>
        </div>
        {onClose ? <DialogCloseButton onClose={onClose} /> : null}
      </div>

      <div className={styles.controls}>
        <div className={styles.seg} role="group" aria-label={t("kindGroupLabel")}>
          <button type="button" aria-pressed={kind === "stock"} onClick={() => setKind("stock")}>
            <Icon name="film" size={18} />
            {t("kindStock")}
          </button>
          <button type="button" aria-pressed={kind === "camera"} onClick={() => setKind("camera")}>
            <Icon name="camera" size={18} />
            {t("kindCamera")}
          </button>
        </div>

        <Field
          label={t("searchLabel")}
          hint={t("searchHint")}
          type="search"
          placeholder={kind === "stock" ? t("searchPlaceholderStock") : t("searchPlaceholderCamera")}
          value={rawQuery}
          onChange={(event) => setRawQuery(event.target.value)}
        />
      </div>

      <div className={styles.results}>
        {hasHits ? (
          <>
            {isSearching ? (
              <p className={styles.resultCount}>{t("resultCount", { count: entries.length, query: debouncedQuery })}</p>
            ) : null}
            {/* C5 (audit, CatalogueSearchWeb): desktop-only table header row, hidden on phone via CSS. */}
            <div className={cx(styles.tableHeaderRow, kind === "stock" ? styles.tableHeaderRowStock : styles.tableHeaderRowCamera)} aria-hidden="true">
              <span />
              <span>{t("colName")}</span>
              <span>{t("colBrand")}</span>
              <span>{t("colType")}</span>
              {kind === "stock" ? <span>{t("colIso")}</span> : null}
              <span>{t("colFormat")}</span>
              <span />
            </div>
            <ul className={styles.list}>
              {displayEntries.map((entry) => {
                const key = entryKey(entry.kind, entry.id);
                const inBag = addedKeys.has(key);
                // C3 (audit, approved by the owner 27.09.2026): the board
                // drops the brand from the stock row name — it's already
                // first in `meta`. Camera keeps `brand + model` (no
                // separate brand column there). W2 updates RollForm's own
                // tests for this shared component.
                const label = entry.kind === "stock" ? entry.name : `${entry.brand} ${entry.model}`;
                const typeKey = entry.kind === "stock" ? stockTypeLabelKey(entry.type) : cameraTypeLabelKey(entry.type);
                const typeLabel = typeKey ? tTypes(typeKey) : null;
                // E3: a camera's "other" ("Khác") format is translated;
                // every other format (stock's 35mm/120 included) renders as-is.
                const cameraFormatKey = entry.kind === "camera" ? cameraFormatLabelKey(entry.format) : null;
                const cameraFormatText = cameraFormatKey ? tTypes(cameraFormatKey) : (entry.kind === "camera" ? entry.format : null);
                const meta =
                  entry.kind === "stock"
                    ? joinMeta([entry.iso != null && `ISO ${entry.iso}`, entry.brand, typeLabel, entry.formats?.join(", ")])
                    : joinMeta([entry.brand, typeLabel, cameraFormatText]);
                // BAG-2 (N6): a stock already counted in the bag shows
                // "×N" (or "hết" at 0) instead of the plain "Trong túi" stamp.
                const bagQty = entry.kind === "stock" ? bagQtyByKey?.get(key) : undefined;
                const qtyBadge = bagQty != null ? (bagQty > 0 ? `×${bagQty}` : t("stockOut")) : null;

                // C5: the same fields `meta` joins for the phone line,
                // kept separate too so the desktop table can put each in
                // its own column.
                const isoCell = entry.kind === "stock" && entry.iso != null ? `ISO ${entry.iso}` : "—";
                const formatCell = entry.kind === "stock" ? (entry.formats?.join(", ") ?? "—") : (cameraFormatText ?? "—");

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={cx(styles.result, kind === "stock" ? styles.resultStock : styles.resultCamera)}
                      onClick={() => handlePick(entry)}
                      disabled={inBag || pendingKey === key}
                      aria-label={inBag ? `${label}, ${t("inBag")}` : label}
                    >
                      {entry.kind === "stock" ? (
                        <CanisterSwatch color={entry.canisterColor} />
                      ) : (
                        <span className={styles.cameraIcon}>
                          <Icon name="camera" size={20} />
                        </span>
                      )}
                      <span className={styles.resultText}>
                        <span className={styles.resultName}>{label}</span>
                        {meta ? <span className={styles.resultMeta}>{meta}</span> : null}
                      </span>
                      <span className={styles.colBrand}>{entry.brand}</span>
                      <span className={styles.colType}>{typeLabel ?? "—"}</span>
                      {kind === "stock" ? <span className={styles.colIso}>{isoCell}</span> : null}
                      <span className={styles.colFormat}>{formatCell}</span>
                      {qtyBadge ? (
                        <Stamp tone="ink">{qtyBadge}</Stamp>
                      ) : inBag ? (
                        <Stamp tone="ink">{t("inBag")}</Stamp>
                      ) : (
                        <span className={styles.pick} aria-hidden="true">
                          {t("pick")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {noHits ? (
          <div className={styles.empty} data-testid={`${noun}-empty`}>
            <span className={styles.emptyCanister} aria-hidden="true">
              ?
            </span>
            <Scribble size="sm">{t("emptyScribble")}</Scribble>
            <p className={styles.emptyTitle}>{t("emptyTitle", { query: debouncedQuery })}</p>
            <p className={styles.emptyBody}>{t(kind === "stock" ? "emptyBodyStock" : "emptyBodyCamera")}</p>
            <button type="button" className={styles.emptyAdd} onClick={() => onAddCustom(kind, rawQuery.trim())}>
              {addCustomLabel}
            </button>
            <button type="button" className={styles.clearSearch} onClick={() => setRawQuery("")}>
              {t("clearSearch")}
            </button>
          </div>
        ) : null}
      </div>

      {/* C6 (audit): pinned footer inside the fixed-height dialog — a
          sibling of the scrollable `.results`, not inside it, so it never
          scrolls out of view at any width. */}
      {hasHits || onGoBack ? (
        <div className={styles.pinnedFooter}>
          {onGoBack ? (
            <button type="button" className={styles.backLink} onClick={onGoBack}>
              {backLabel}
            </button>
          ) : null}
          {hasHits ? (
            <div className={styles.pinnedFooterAdd}>
              <button type="button" className={styles.addCustomLink} onClick={() => onAddCustom(kind, rawQuery.trim())}>
                <span className={styles.notFound}>{notFoundPrompt}</span> {addCustomLabel}
              </button>
              <p className={styles.footerHint}>{t("footerHint")}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
