import { useTranslations } from "next-intl";
import { Canister } from "@/components/canister/Canister";
import { Scribble } from "@/design-system";
import { cx } from "@/design-system/cx";
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
 * "N cuộn chờ nạp" note. With no counted film it still draws the empty
 * shelf (owner 28.09.2026), with a "chưa có cuộn nào chờ nạp" note.
 */
export function BagCanisterStrip({ canisters, unloadedRolls }: BagCanisterStripProps) {
  const t = useTranslations("bag");

  const empty = unloadedRolls <= 0;
  const note = empty ? t("canisterStripEmpty") : t("canisterStripNote", { count: unloadedRolls });

  return (
    <div className={styles.root}>
      <div className={cx(styles.pocket, empty && styles.pocketEmpty)}>
        <ul className={styles.strip} aria-label={note}>
          {canisters.flatMap((canister) =>
            Array.from({ length: canister.qty }, (_, index) => (
              <li key={`${canister.stockId}-${index}`} className={styles.canisterItem}>
                <Canister color={canister.canisterColor} iso={canister.iso} />
              </li>
            )),
          )}
        </ul>
        <span className={styles.note}>
          <Scribble arrow={empty ? "none" : "left"} size="sm">
            {note}
          </Scribble>
        </span>
      </div>
      <div className={styles.ledge} aria-hidden="true" />
      <div className={styles.ledgeBase} aria-hidden="true" />
    </div>
  );
}
