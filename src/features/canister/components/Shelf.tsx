import Link from "next/link";
import { useTranslations } from "next-intl";
import { Canister } from "@/components/canister/Canister";
import { ButtonLink, Scribble, Stamp } from "@/design-system";
import type { IRollEntry } from "@/features/rolls/core";
import { RollUploadBadge } from "@/features/uploads/components/RollUploadBadge";
import { toCanisterProps } from "../to-canister-props";
import styles from "./Shelf.module.css";

/** ShelfEmpty / ShelfEmptyWeb: a dashed placeholder canister on an empty ledge, then the two ways to add a roll. */
function EmptyShelf() {
  const t = useTranslations("shelf");
  return (
    <div className={styles.empty}>
      <div className={styles.emptyStage}>
        <div className={styles.emptyRow}>
          <span className={styles.ghost} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className={styles.emptyNote} aria-hidden="true">
            <Scribble arrow="left" size="sm" className={styles.note}>
              {t("emptyNote")}
            </Scribble>
          </span>
        </div>
        <div className={styles.ledgeBar} aria-hidden="true" />
      </div>
      <div className={styles.emptyCopy}>
        <div className={styles.emptyText}>
          <h2 className={styles.emptyTitle}>{t("emptyTitle")}</h2>
          <p className={styles.emptyBody}>{t("emptyBody")}</p>
        </div>
        <div className={styles.emptyActions}>
          <ButtonLink href="/rolls/new" variant="primary" className={styles.emptyCta}>
            {t("emptyCta")}
          </ButtonLink>
          <Link href="/rolls/new?mode=past" className={styles.emptyPast}>
            {t("emptyPast")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * CAN-1: the library as canisters standing on wooden ledges, newest first
 * (`Shelf` / `ShelfWeb` boards): 3 per ledge on the phone, 6 from 1024px.
 * Each canister links to its roll; the stock name sits under it as text,
 * never on it, then the scan status ("Chờ scan" before any scans).
 */
export function Shelf({ rolls }: { rolls: IRollEntry[] }) {
  const t = useTranslations("shelf");
  if (rolls.length === 0) return <EmptyShelf />;

  return (
    <ul className={styles.shelf}>
      {rolls.map((roll) => {
        const film = roll.stock ? `${roll.stock.brand} ${roll.stock.name}` : null;
        // N1: "Cuộn #N"; a row that missed the number backfill falls back to its film.
        const fallbackName = roll.number != null ? t("unnamedRoll", { number: roll.number }) : (film ?? t("unnamedRoll", { number: "?" }));
        const canister = toCanisterProps(roll, fallbackName);
        const name = canister.label ?? fallbackName;
        const statusId = `shelf-status-${roll.id}`;
        return (
          <li key={roll.id} className={styles.item}>
            <Link
              href={`/rolls/${roll.id}`}
              className={styles.slot}
              aria-label={film ? t("canisterLink", { name, film }) : name}
              aria-describedby={statusId}
            >
              <Canister {...canister} className={styles.canister} />
              <span className={styles.text}>
                {/* R10: a photo has no label band, so the roll's name is printed under it instead. */}
                {canister.photoSrc ? <span className={styles.name}>{name}</span> : null}
                {film ? <span className={styles.stock}>{film}</span> : null}
                <span id={statusId} className={styles.status}>
                  <RollUploadBadge
                    rollId={roll.id}
                    frameCount={roll.frameCount ?? 0}
                    waiting={<Stamp>{t("waitingForScans")}</Stamp>}
                  />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
