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
 * `/profile` (F4, Design finding 5): the Google avatar, the display name,
 * the read-only email and join date, the theme control and sign out.
 * Deliberately nothing else — stats, "Túi của tôi", recent keepers,
 * language, share links and delete account belong to their own later
 * tasks. No bottom tab bar (F3).
 *
 * Matches the `Profile` / `ProfileDark` / `ProfileWeb` boards: a
 * phone-only quick theme toggle up top, an identity row with the name as
 * the page's one `h1`, a "Cài đặt" section (the `Sáng`/`Tối` segmented
 * control, then a "Sửa tên hiển thị ›" row that links to `/profile/name`
 * instead of an inline form), and a full-width outline sign-out button.
 * Desktop (`ProfileWeb`) turns the same content into a 400px left column
 * plus an empty right column reserved for the bag/keepers that come
 * later; the shared app header/nav is F3's to build, so this doesn't
 * render one — the segmented control (present at every width) is what
 * keeps the theme reachable on desktop without it.
 */
export function ProfileContent({ name, email, image, createdAt, summary }: ProfileContentProps) {
  const t = useTranslations("profile");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>{t("title")}</span>
        <ThemeToggle />
      </div>

      <div className={styles.left}>
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

        {summary ? (
          <div className={styles.statTile}>
            <span className={styles.statValue}>{summary.rollCount}</span>
            <span className={styles.statLabel}>{t("statRolls", { count: summary.rollCount })}</span>
          </div>
        ) : null}

        <section aria-labelledby="profile-settings-heading">
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

      {/* PR3/PR4/PR5/PR7/PR8: "Túi của tôi" is real; the rest (recent
          keepers, share links, delete account) wait for their own tasks
          and stay hidden rather than faked. */}
      {summary && (summary.cameras.length > 0 || summary.stocks.length > 0) ? (
        <div className={styles.right}>
          <section aria-labelledby="profile-bag-heading">
            <div className={styles.bagHeadingRow}>
              <h2 id="profile-bag-heading" className={styles.settingsHeading}>
                {t("bagHeading")}
              </h2>
              <Link href="/bag" className={styles.bagEditLink}>
                {t("bagEditLink")}
              </Link>
            </div>

            {summary.cameras.length > 0 ? (
              <ul className={styles.bagCameraList}>
                {summary.cameras.map((camera) => (
                  <li key={camera.bagItemId} className={styles.bagCameraRow}>
                    <Icon name="camera" size={16} />
                    <span className={styles.bagCameraName}>
                      {camera.brand} {camera.model}
                    </span>
                    <span className={styles.bagCameraCount}>
                      {t("bagCameraRolls", { count: camera.rollsShot })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {summary.stocks.length > 0 ? (
              <ul className={styles.bagFilmSwatches} aria-label={t("bagFilmSwatchesLabel")}>
                {summary.stocks.map((stock) => (
                  <li
                    key={stock.stockId}
                    className={styles.bagFilmSwatch}
                    style={{ "--rc-stock": `var(--stock-${stock.canisterColor ?? "gold"})` } as CSSProperties}
                    title={`${stock.brand} ${stock.name}`}
                  />
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
