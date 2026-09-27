"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { ButtonLink, Field, Icon } from "@/design-system";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { addToBag, listBag, removeFromBag } from "@/features/bag/actions";
import { searchCatalogue } from "@/features/catalogue/actions";
import {
  CustomEntryForm,
  type ICustomEntryCreated,
  type TCustomEntryKind,
} from "@/features/catalogue/components/CustomEntryForm";
import { chipKey, chipLabel, type ICameraChip, type IStockChip, type TChip } from "@/features/onboarding/types";

const DEBOUNCE_MS = 200;

export interface OnboardBagContentProps {
  initialCameraChips: ICameraChip[];
  initialStockChips: IStockChip[];
  /** `${kind}:${id}` → `bagItemId`, from the caller's bag at page load. */
  initialCheckedRefs: Record<string, string>;
}

function dedupeChips<T extends TChip>(groups: T[][]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const group of groups) {
    for (const chip of group) {
      const key = chipKey(chip.kind, chip.id);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(chip);
    }
  }
  return result;
}

/** The board's `.mcan`: a small canister capsule, coloured by `stock.canisterColor`. */
function CanisterSwatch({ color }: { color: string | null }) {
  const style = { background: `var(--stock-${color ?? "gold"})` } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      className="box-border h-5 w-3 flex-none rounded-sm shadow-[inset_0_3px_0_var(--film),inset_0_-3px_0_var(--film)]"
      style={style}
    />
  );
}

interface ChipButtonProps {
  chip: TChip;
  checked: boolean;
  pending: boolean;
  onToggle: (chip: TChip) => void;
}

function ChipButton({ chip, checked, pending, onToggle }: ChipButtonProps) {
  const label = chipLabel(chip);
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={pending}
      onClick={() => onToggle(chip)}
      className={`inline-flex min-h-11 items-center gap-2 border px-3.5 font-sans text-body-sm font-medium select-none disabled:opacity-70 ${
        checked ? "border-ink bg-ink text-paper" : "border-line-strong bg-paper-raised text-ink"
      }`}
    >
      {chip.kind === "camera" ? <Icon name="camera" size={18} /> : <CanisterSwatch color={chip.canisterColor} />}
      <span>{label}</span>
      {checked ? (
        <span aria-hidden="true" className="font-bold">
          ✓
        </span>
      ) : null}
    </button>
  );
}

interface ChipGroupProps {
  label: string;
  chips: TChip[];
  checkedKeys: ReadonlySet<string>;
  pendingKeys: ReadonlySet<string>;
  onToggle: (chip: TChip) => void;
  addCustomLabel: string;
  onAddCustom: () => void;
}

function ChipGroup({ label, chips, checkedKeys, pendingKeys, onToggle, addCustomLabel, onAddCustom }: ChipGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-sans text-label uppercase text-ink-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const key = chipKey(chip.kind, chip.id);
          return (
            <ChipButton
              key={key}
              chip={chip}
              checked={checkedKeys.has(key)}
              pending={pendingKeys.has(key)}
              onToggle={onToggle}
            />
          );
        })}
        <button
          type="button"
          onClick={onAddCustom}
          className="inline-flex min-h-11 items-center gap-2 border border-dashed border-line-strong bg-transparent px-3.5 font-sans text-body-sm font-medium text-cobalt select-none"
        >
          {addCustomLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * F1 · `/onboarding/bag`'s interactive half: curated + searched + custom
 * chips for Máy ảnh and Film, each toggled straight into the bag
 * (optimistic, reverted on error), plus "+ Máy khác" / "+ Film khác"
 * opening `CustomEntryForm` (D1) in a `ResponsiveDialog`.
 */
export function OnboardBagContent({ initialCameraChips, initialStockChips, initialCheckedRefs }: OnboardBagContentProps) {
  const t = useTranslations("onboarding.bag");
  const dialogTitleId = useId();

  const [createdCameraChips, setCreatedCameraChips] = useState<ICameraChip[]>([]);
  const [createdStockChips, setCreatedStockChips] = useState<IStockChip[]>([]);
  const [searchCameraChips, setSearchCameraChips] = useState<ICameraChip[]>([]);
  const [searchStockChips, setSearchStockChips] = useState<IStockChip[]>([]);

  const [checkedKeys, setCheckedKeys] = useState<Map<string, string>>(() => new Map(Object.entries(initialCheckedRefs)));
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(() => new Set());

  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const requestId = useRef(0);

  const [customKind, setCustomKind] = useState<TCustomEntryKind | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  useEffect(() => {
    if (debouncedQuery === "") return;

    const thisRequest = ++requestId.current;

    Promise.all([
      searchCatalogue({ kind: "camera", q: debouncedQuery }),
      searchCatalogue({ kind: "stock", q: debouncedQuery }),
    ]).then(([cameraResult, stockResult]) => {
      if (thisRequest !== requestId.current) return;

      setSearchCameraChips(
        cameraResult.ok
          ? cameraResult.entries
              .filter((entry) => entry.kind === "camera")
              .map((entry) => ({ kind: "camera" as const, id: entry.id, brand: entry.brand, model: entry.model }))
          : [],
      );
      setSearchStockChips(
        stockResult.ok
          ? stockResult.entries
              .filter((entry) => entry.kind === "stock")
              .map((entry) => ({
                kind: "stock" as const,
                id: entry.id,
                brand: entry.brand,
                name: entry.name,
                canisterColor: entry.canisterColor,
              }))
          : [],
      );
    });
  }, [debouncedQuery]);

  // A cleared search box drops back to just the curated + custom chips
  // (matching `searchCameraChips`/`searchStockChips` state, rather than
  // clearing it, to the debounced query itself — no need to `setState`
  // from inside the search effect just to blank these out).
  const cameraChips = useMemo(
    () => dedupeChips<ICameraChip>([initialCameraChips, createdCameraChips, debouncedQuery ? searchCameraChips : []]),
    [initialCameraChips, createdCameraChips, searchCameraChips, debouncedQuery],
  );
  const stockChips = useMemo(
    () => dedupeChips<IStockChip>([initialStockChips, createdStockChips, debouncedQuery ? searchStockChips : []]),
    [initialStockChips, createdStockChips, searchStockChips, debouncedQuery],
  );

  async function toggleChip(chip: TChip) {
    const key = chipKey(chip.kind, chip.id);
    if (pendingKeys.has(key)) return;

    setPendingKeys((prev) => new Set(prev).add(key));
    const wasChecked = checkedKeys.has(key);

    if (wasChecked) {
      const bagItemId = checkedKeys.get(key) as string;
      setCheckedKeys((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });

      const result = await removeFromBag({ bagItemId });
      if (!result.ok) {
        setCheckedKeys((prev) => new Map(prev).set(key, bagItemId));
      }
    } else {
      setCheckedKeys((prev) => new Map(prev).set(key, ""));

      const result = await addToBag({ kind: chip.kind, refId: chip.id });
      if (result.ok) {
        setCheckedKeys((prev) => new Map(prev).set(key, result.bagItemId));
      } else if (result.error === "duplicate") {
        const bag = await listBag();
        const match = bag.find(
          (entry) =>
            (entry.kind === "stock" && chip.kind === "stock" && entry.stock.id === chip.id) ||
            (entry.kind === "camera" && chip.kind === "camera" && entry.camera.id === chip.id),
        );
        setCheckedKeys((prev) => new Map(prev).set(key, match?.bagItemId ?? ""));
      } else {
        setCheckedKeys((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    }

    setPendingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  async function handleCustomCreated(entry: ICustomEntryCreated) {
    setCustomKind(null);
    if (entry.kind === "lens") return; // no lens chips in F1's bag onboarding

    const key = chipKey(entry.kind, entry.refId);
    setCheckedKeys((prev) => new Map(prev).set(key, entry.bagItemId));

    const bag = await listBag();
    const match = bag.find((item) => item.bagItemId === entry.bagItemId);
    if (!match) return;

    if (match.kind === "stock") {
      setCreatedStockChips((prev) => [
        ...prev,
        { kind: "stock", id: match.stock.id, brand: match.stock.brand, name: match.stock.name, canisterColor: match.stock.canisterColor },
      ]);
    } else if (match.kind === "camera") {
      setCreatedCameraChips((prev) => [
        ...prev,
        { kind: "camera", id: match.camera.id, brand: match.camera.brand, model: match.camera.model },
      ]);
    }
  }

  return (
    <OnboardingFrame
      step={1}
      skipHref="/onboarding/first-roll"
      footer={
        <>
          <span className="text-center font-sans text-meta text-ink-muted lg:text-left">{t("footerHint")}</span>
          <ButtonLink href="/onboarding/first-roll" variant="primary" className="lg:w-auto lg:px-8">
            {t("continue")}
          </ButtonLink>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-display-l font-medium">{t("title")}</h1>
        <p className="text-body-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="lg:w-[520px]">
        <Field
          label={t("searchLabel")}
          hint={t("searchHint")}
          type="search"
          placeholder={t("searchPlaceholder")}
          value={rawQuery}
          onChange={(event) => setRawQuery(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        <ChipGroup
          label={t("cameraGroupLabel")}
          chips={cameraChips}
          checkedKeys={new Set(checkedKeys.keys())}
          pendingKeys={pendingKeys}
          onToggle={toggleChip}
          addCustomLabel={t("addCustomCamera")}
          onAddCustom={() => setCustomKind("camera")}
        />
        <ChipGroup
          label={t("stockGroupLabel")}
          chips={stockChips}
          checkedKeys={new Set(checkedKeys.keys())}
          pendingKeys={pendingKeys}
          onToggle={toggleChip}
          addCustomLabel={t("addCustomStock")}
          onAddCustom={() => setCustomKind("stock")}
        />
      </div>

      <ResponsiveDialog open={customKind !== null} onClose={() => setCustomKind(null)} labelledBy={dialogTitleId}>
        {customKind ? (
          <CustomEntryForm titleId={dialogTitleId} initialKind={customKind} onCreated={handleCustomCreated} />
        ) : null}
      </ResponsiveDialog>
    </OnboardingFrame>
  );
}
