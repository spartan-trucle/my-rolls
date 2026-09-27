"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cx } from "@/design-system/cx";
import styles from "./TopNav.module.css";

export interface TopNavProps {
  /** Uppercase first letter of the signed-in user's name, for the avatar. */
  userInitial: string;
  className?: string;
}

/**
 * Desktop chrome (1024px and up, see `AppShell`), from the `HomeWeb` /
 * `ProfileWeb` boards: the "Cuộn" wordmark, nav links (active one
 * underlined in `cobalt`, conflict #9), a "Cuộn mới" action, `ThemeToggle`
 * and the avatar. The boards don't draw a theme switch on this header, but
 * every other screen's chrome carries one, so it's kept here too.
 *
 * Tấm ưng has no screen until Phase 3: a disabled `<span>`, never a link.
 */
export function TopNav({ userInitial, className }: TopNavProps) {
  const pathname = usePathname();
  const t = useTranslations("appShell");

  const current = (href: string) => (pathname === href ? ("page" as const) : undefined);

  return (
    <header className={cx(styles.header, className)}>
      <div className={styles.leading}>
        <Link href="/" className={styles.wordmark}>
          {t("wordmark")}
        </Link>
        <nav className={styles.nav} aria-label={t("navLabel")}>
          <Link href="/" aria-current={current("/")} className={styles.link}>
            {t("nav.shelf")}
          </Link>
          <Link href="/bag" aria-current={current("/bag")} className={styles.link}>
            {t("nav.bag")}
          </Link>
          <span className={cx(styles.link, styles.linkDisabled)} aria-disabled="true">
            {t("nav.keepers")}
          </span>
        </nav>
      </div>
      <div className={styles.trailing}>
        <Link href="/rolls/new" className={styles.newRollButton}>
          {t("nav.newRoll")}
        </Link>
        <ThemeToggle />
        <Link href="/profile" aria-current={current("/profile")} aria-label={t("avatarAlt")} className={styles.avatar}>
          {userInitial}
        </Link>
      </div>
    </header>
  );
}
