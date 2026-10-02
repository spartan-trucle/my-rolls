"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cx } from "@/design-system/cx";
import { LibraryNavLink } from "./LibraryNavLink";
import styles from "./TopNav.module.css";

export interface TopNavProps {
  /** Uppercase first letter of the signed-in user's name, for the avatar. */
  userInitial: string;
  className?: string;
}

/** G5: Kệ is current on `/` and under `/rolls/*`. */
const shelfCurrent = (pathname: string) => pathname === "/" || pathname.startsWith("/rolls/");

/**
 * Desktop chrome (1024px and up, see `AppShell`), from the `HomeWeb` /
 * `ProfileWeb` boards: the "Cuộn" wordmark, nav links (active one
 * underlined in `cobalt`, conflict #9), a "Cuộn mới" action, `ThemeToggle`
 * and the avatar. The boards don't draw a theme switch on this header, but
 * every other screen's chrome carries one, so it's kept here too.
 *
 * Tấm ưng opens the library grid filtered to tấm ưng (D15), and is the
 * current item there instead of Kệ (Ruling R28).
 *
 * G5: "Kệ" also reads as current under `/rolls/*` — the roll form and roll
 * page are reached from the shelf and have no nav item of their own — and
 * the "Cuộn mới" button hides on `/rolls/new` itself (`NewRollWeb`: no
 * point linking to the page you're already on).
 */
export function TopNav({ userInitial, className }: TopNavProps) {
  const pathname = usePathname();
  const t = useTranslations("appShell");

  const current = (href: string) => (pathname === href ? ("page" as const) : undefined);
  const showNewRollButton = pathname !== "/rolls/new";

  return (
    <header className={cx(styles.header, className)}>
      <div className={styles.leading}>
        <Link href="/" className={styles.wordmark}>
          {t("wordmark")}
        </Link>
        <nav className={styles.nav} aria-label={t("navLabel")}>
          <LibraryNavLink tab="shelf" shelfCurrent={shelfCurrent} className={styles.link}>
            {t("nav.shelf")}
          </LibraryNavLink>
          <Link href="/bag" aria-current={current("/bag")} className={styles.link}>
            {t("nav.bag")}
          </Link>
          <LibraryNavLink tab="keepers" className={styles.link}>
            {t("nav.keepers")}
          </LibraryNavLink>
        </nav>
      </div>
      <div className={styles.trailing}>
        {showNewRollButton ? (
          <Link href="/rolls/new" className={styles.newRollButton}>
            {t("nav.newRoll")}
          </Link>
        ) : null}
        <ThemeToggle />
        <Link href="/profile" aria-current={current("/profile")} aria-label={t("avatarAlt")} className={styles.avatar}>
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
