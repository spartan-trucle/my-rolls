import { useTranslations } from "next-intl";
import { Canister } from "@/components/canister/Canister";
import { Scribble } from "@/design-system";
import type { IBagCanisterSummary } from "@/features/bag/queries";
import styles from "./BagCanisterStrip.module.css";

export interface BagCanisterStripProps {
  canisters: IBagCanisterSummary[];
  unloadedRolls: number;
}

/**
 * R2-3 (Bag board's pocket strip, audit B1): one drawn `Canister` per
 * unloaded roll — a stock counted 3× draws three canisters, in
 * `summarizeBag`'s order (newest bag item first) — with the handwritten
 * "N cuộn chờ nạp" note. Renders nothing when the bag has no counted
 * film (never an empty strip).
 */
export function BagCanisterStrip({ canisters, unloadedRolls }: BagCanisterStripProps) {
  const t = useTranslations("bag");

  if (unloadedRolls <= 0) return null;

  return (
    <div className={styles.root}>
      <ul className={styles.strip} aria-label={t("canisterStripNote", { count: unloadedRolls })}>
        {canisters.flatMap((canister) =>
          Array.from({ length: canister.qty }, (_, index) => (
            <li key={`${canister.stockId}-${index}`} className={styles.canisterItem}>
              <Canister color={canister.canisterColor} iso={canister.iso} />
            </li>
          )),
        )}
      </ul>
      <Scribble arrow="left" size="sm">
        {t("canisterStripNote", { count: unloadedRolls })}
      </Scribble>
    </div>
  );
}
