"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button, Field } from "@/design-system";
import { listLabCitiesAction, searchLabsAction } from "@/features/labs/actions";
import type { ILabWithBranches } from "@/features/labs/core";
import { cx } from "@/design-system/cx";
import styles from "./LabPicker.module.css";

const SEARCH_DEBOUNCE_MS = 200;

export interface ILabPick {
  labId: string;
  branchId: string | null;
  /** The lab's name and the branch's place line, for the scan-set form's lab row (Phase 2 F2). */
  name: string;
  place: string;
}

export interface LabPickerProps {
  /** The board's "Cuộn #14 · Gold 200" label — which roll this pick is for. */
  heading: ReactNode;
  onPick: (pick: ILabPick) => void;
  onAddNew: () => void;
  className?: string;
}

interface IPickerRow {
  key: string;
  labId: string;
  branchId: string | null;
  name: string;
  place: string;
  meta: string;
}

/**
 * `searchLabs` returns one lab with all its live branches attached (D8's
 * write-up in `core.ts`). The picker shows one radio row per branch —
 * that's what "Tráng ở lab nào?" is really choosing between — falling
 * back to a single lab-level row for a branch-less lab (home
 * development). Order is kept exactly as the server returned it, so home
 * development stays pinned first.
 */
function toRows(labs: ILabWithBranches[]): IPickerRow[] {
  return labs.flatMap((lab): IPickerRow[] => {
    if (lab.branches.length === 0) {
      return [
        {
          key: lab.id,
          labId: lab.id,
          branchId: null,
          name: lab.name,
          place: lab.address ?? "",
          meta: (lab.services ?? []).join(" · "),
        },
      ];
    }

    return lab.branches.map((branch) => {
      const location = [branch.district, branch.areaHint].filter(Boolean).join(" · ");
      return {
        key: branch.id,
        labId: lab.id,
        branchId: branch.id,
        name: lab.name,
        place: location ? `${location}, ${branch.city}` : branch.city,
        meta: (branch.services ?? lab.services ?? []).join(" · "),
      };
    });
  });
}

/**
 * F2: `LabPicker` from the `LabPicker` / `LabPickerWeb` boards. City chips
 * and search both go through `searchLabsAction`; picking a row is a local
 * `chosen` state, and the primary "Chọn {lab}" button is what actually
 * calls `onPick` — same two-step shape as the board (a radio commits
 * nothing by itself, the CTA does).
 */
export function LabPicker({ heading, onPick, onAddNew, className }: LabPickerProps) {
  const t = useTranslations("labs.picker");
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [qInput, setQInput] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [rows, setRows] = useState<IPickerRow[]>([]);
  const [chosen, setChosen] = useState<IPickerRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLabCitiesAction().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setQDebounced(qInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    let cancelled = false;
    // Deferred a tick so `setLoading(true)` runs from a promise callback,
    // not synchronously in the effect body (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    searchLabsAction({ q: qDebounced || undefined, city })
      .then((labs) => {
        if (cancelled) return;
        const nextRows = toRows(labs);
        setRows(nextRows);
        setChosen((current) =>
          current && nextRows.some((row) => row.key === current.key) ? current : null,
        );
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qDebounced, city]);

  const listTitle = city ? t("listTitleCity", { city }) : t("listTitleAll");
  const chooseLabel = t("chooseButton", { lab: chosen?.name ?? "" });

  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <span className="text-label uppercase text-ink-muted">{heading}</span>
        {/* L1: the board's h1, under the "Cuộn #N · Film" kicker `heading` prop. */}
        <h1 className="font-display text-display-l text-balance">{t("title")}</h1>
      </div>

      <div className={styles.searchRow}>
        <Field
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          hint={t("searchHint")}
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
        />
        <div className={styles.cities}>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={city === undefined}
            onClick={() => setCity(undefined)}
          >
            {t("allCities")}
          </button>
          {cities.map((cityName) => (
            <button
              key={cityName}
              type="button"
              className={styles.chip}
              aria-pressed={city === cityName}
              onClick={() => setCity(cityName)}
            >
              {cityName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-grow flex-col min-h-0 overflow-hidden">
        <span className={styles.listTitle}>{listTitle}</span>
        {loading ? (
          <span className={styles.statusText}>{t("loading")}</span>
        ) : rows.length === 0 ? (
          <span className={styles.statusText}>{t("emptyState")}</span>
        ) : (
          <div className={styles.list}>
            {rows.map((row) => (
              <label key={row.key} className={styles.row}>
                <input
                  type="radio"
                  name="lab-picker"
                  className={styles.radio}
                  checked={chosen?.key === row.key}
                  onChange={() => setChosen(row)}
                />
                <span className={styles.rowBody}>
                  <span className={styles.rowName}>{row.name}</span>
                  {row.place ? <span className={styles.rowPlace}>{row.place}</span> : null}
                  {row.meta ? <span className={styles.rowMeta}>{row.meta}</span> : null}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className={styles.addPanel}>
          <span className={styles.addPanelPrompt}>{t("notFoundPrompt")}</span>
          <button type="button" className={styles.addPanelLink} onClick={onAddNew}>
            {t("addNewLink")}
          </button>
        </div>
        <Button
          variant="primary"
          className="w-full"
          disabled={!chosen}
          onClick={() => chosen && onPick({ labId: chosen.labId, branchId: chosen.branchId, name: chosen.name, place: chosen.place })}
        >
          {chooseLabel}
        </Button>
      </div>
    </div>
  );
}
