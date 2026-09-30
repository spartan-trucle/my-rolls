import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Button, Icon } from "@/design-system";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ThemeSegmented } from "@/components/theme/ThemeSegmented";
import type { IProfileSummary } from "@/features/bag/queries";
import { signOutAction } from "@/lib/sign-out-action";
import { formatJoinedDate } from "./format-joined-date";
import styles from "./page.module.css";

export interface ProfileContentProps {
  name: string;
  email: string;
  image: string | null | undefined;
  createdAt: Date;
  /**
   * PR1/PR3/PR4 (Round 2): the roll-count stat tile and "Túi của tôi"
   * preview. Optional and `undefined` renders neither — used by every
   * existing caller/test that only exercises identity + settings, and by
   * an unauthenticated edge case `getProfileSummary` itself can't hit
   * (this component doesn't fetch). Stats this task has no data for yet
   * (tấm ưng, oops, share links, delete account) stay hidden rather than
   * faked, per the task brief.
   */
  summary?: IProfileSummary | null;
}

/** Decorative Google "G" mark next to the email (board: `Profile`/`ProfileWeb`). */
function GoogleGIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * `/profile` (F4, Design finding 5), per the `Profile` / `ProfileWeb`
 * boards: a phone-only "Hồ sơ" row with the quick theme toggle (the phone
 * top bar is hidden on this route), the Google avatar with the name as the
 * page's one `h1`, the email and join date, the roll-count tile, "Túi của
 * tôi" (cameras with rolls shot, films as named chips), then "Cài đặt"
 * (the `Sáng`/`Tối` control, "Sửa tên hiển thị ›" linking to
 * `/profile/name`) and a full-width outline sign-out button. Recent
 * keepers, tấm ưng/oops tiles, language, share links and delete account
 * belong to later phases and stay hidden.
 */
export function ProfileContent({ name, email, image, createdAt, summary }: ProfileContentProps) {
  const t = useTranslations("profile");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  // Profile/ProfileWeb boards: phone reads identity → stats → "Túi của
  // tôi" → "Cài đặt"; desktop puts identity, stats and settings in a 400px
  // left column and the bag on the right. The parts are siblings in phone
  // order, and the desktop grid places each one (see page.module.css).
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>{t("title")}</span>
        <ThemeToggle />
      </div>

      <div className={styles.identity}>
        {image ? (
          <Image
            src={image}
            alt={t("avatarAlt")}
            width={80}
            height={80}
            className={styles.avatarImage}
          />
        ) : (
          <span className={styles.avatarFallback} role="img" aria-label={t("avatarAlt")}>
            {initial}
          </span>
        )}
        <div className={styles.identityText}>
          <h1 className={styles.name}>{name}</h1>
          <span className={styles.emailRow}>
            <GoogleGIcon />
            {email}
          </span>
          <span className={styles.joined}>{t("joined", { date: formatJoinedDate(createdAt) })}</span>
        </div>
      </div>

      {/* PR1: the roll count as the board's boxed tile. Tấm ưng and oops
          tiles wait for Phase 2 data and stay hidden rather than faked. */}
      {summary ? (
        <div className={styles.stats}>
          <div className={styles.statTile} data-testid="profile-stat-rolls">
            <span className={styles.statValue}>
              <Icon name="roll" size={18} />
              {summary.rollCount}
            </span>
            <span className={styles.statLabel}>{t("statRolls")}</span>
          </div>
        </div>
      ) : null}

      {/* PR3/PR4: "Túi của tôi" is real; recent keepers, share links and
          delete account wait for their own tasks and stay hidden. */}
      {summary && (summary.cameras.length > 0 || summary.stocks.length > 0) ? (
        <section aria-labelledby="profile-bag-heading" className={styles.bag}>
          <div className={styles.bagHeadingRow}>
            <h2 id="profile-bag-heading" className={styles.settingsHeading}>
              {t("bagHeading")}
            </h2>
            <Link href="/bag" className={styles.bagEditLink}>
              {t("bagEditLink")}
            </Link>
          </div>

          <div className={styles.bagGroups}>
            {summary.cameras.length > 0 ? (
              <div className={styles.bagGroup}>
                <span className={styles.bagGroupLabel}>{t("bagCamerasLabel", { count: summary.cameras.length })}</span>
                <ul className={styles.bagCameraList}>
                  {summary.cameras.map((camera) => (
                    <li key={camera.bagItemId} className={styles.bagCameraRow}>
                      <span className={styles.bagCameraIcon}>
                        <Icon name="camera" size={18} />
                      </span>
                      <span className={styles.bagCameraName}>
                        {camera.brand} {camera.model}
                      </span>
                      <span className={styles.bagCameraCount}>{t("bagCameraRolls", { count: camera.rollsShot })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {summary.stocks.length > 0 ? (
              <div className={styles.bagGroup}>
                <span className={styles.bagGroupLabel}>{t("bagFilmsLabel", { count: summary.stocks.length })}</span>
                <ul className={styles.bagFilmChips} aria-label={t("bagFilmSwatchesLabel")}>
                  {summary.stocks.map((stock) => (
                    <li key={stock.stockId} className={styles.bagFilmChip} title={`${stock.brand} ${stock.name}`}>
                      <span
                        className={styles.bagFilmCan}
                        style={{ "--rc-stock": `var(--stock-${stock.canisterColor ?? "gold"})` } as CSSProperties}
                        aria-hidden="true"
                      />
                      {stock.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="profile-settings-heading" className={styles.settings}>
        <h2 id="profile-settings-heading" className={styles.settingsHeading}>
          {t("settingsHeading")}
        </h2>
        <div className={styles.setrow}>
          <span>{t("themeLabel")}</span>
          <ThemeSegmented />
        </div>
        <Link href="/profile/name" className={styles.setrow}>
          <span>{t("editNameRow")}</span>
          <span className={styles.setrowValue}>›</span>
        </Link>
        <div className={styles.signOutWrap}>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className={styles.signOutButton}>
              {t("signOutButton")}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
