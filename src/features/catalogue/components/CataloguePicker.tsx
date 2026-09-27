"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Field, Icon, Stamp } from "@/design-system";
import { addToBag } from "@/features/bag/actions";
import { searchCatalogue } from "@/features/catalogue/actions";
import type { TCatalogueEntry, TCatalogueKind } from "@/features/catalogue/queries";
import styles from "./CataloguePicker.module.css";

const DEBOUNCE_MS = 200;

export interface CataloguePickerProps {
  /** "stock" (Film) by default — the kind CAT-2's "no thấy?" flow (F1) opens the picker for most. */
  initialKind?: TCatalogueKind;
  /** Composite `${kind}:${id}` keys already in the bag, so a repeat pick shows "Trong túi" from the start. */
  bagRefIds?: ReadonlySet<string>;
  /** Fires once `addToBag` succeeds for a chosen catalogue entry. */
  onPicked: (entry: TCatalogueEntry) => void;
  /** The no-match state's action, and the results list's "không thấy?" link — opens `CustomEntryForm` prefilled with what was typed. */
  onAddCustom: (kind: TCatalogueKind, query: string) => void;
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
 * into the bag. CAT-1's "no thấy" flow and the empty-query state (queries.ts:
 * an empty `q` returns nothing) both route to `onAddCustom` rather than
 * building their own form here.
 */
export function CataloguePicker({
  initialKind = "stock",
  bagRefIds,
  onPicked,
  onAddCustom,
  titleId,
  className,
}: CataloguePickerProps) {
  const t = useTranslations("catalogue.picker");
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
  const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set(bagRefIds ?? []));
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const requestId = useRef(0);

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

  const searched = debouncedQuery !== "" && entriesQuery === debouncedQuery;

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
    <div className={className}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {t("title")}
        </h2>
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
        {debouncedQuery === "" ? <p className={styles.hint}>{t("startHint")}</p> : null}

        {searched && entries.length > 0 ? (
          <>
            <ul className={styles.list}>
              {entries.map((entry) => {
                const key = entryKey(entry.kind, entry.id);
                const inBag = addedKeys.has(key);
                const label =
                  entry.kind === "stock"
                    ? `${entry.brand} ${entry.name}`
                    : `${entry.brand} ${entry.model}`;
                const meta =
                  entry.kind === "stock"
                    ? joinMeta([entry.iso != null && `ISO ${entry.iso}`, entry.brand, entry.type, entry.formats?.join(", ")])
                    : joinMeta([entry.brand, entry.type, entry.format]);

                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={styles.result}
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
                      {inBag ? (
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
            <button type="button" className={styles.addCustomLink} onClick={() => onAddCustom(kind, rawQuery.trim())}>
              <span className={styles.notFound}>{notFoundPrompt}</span> {addCustomLabel}
            </button>
            <p className={styles.footerHint}>{t("footerHint")}</p>
          </>
        ) : null}

        {searched && entries.length === 0 ? (
          <div className={styles.empty} data-testid={`${noun}-empty`}>
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
    </div>
  );
}
