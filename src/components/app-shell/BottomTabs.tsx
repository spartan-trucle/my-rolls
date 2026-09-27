"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/design-system";
import { cx } from "@/design-system/cx";
import styles from "./BottomTabs.module.css";

export interface BottomTabsProps {
  /** Uppercase first letter of the signed-in user's name, for the Tôi tab's avatar. */
  userInitial: string;
  className?: string;
}

/**
 * Phone nav (below 1024px, see `AppShell`), from the `Home` board's
 * `.tabbar`: Kệ, Túi, the raised cobalt "Cuộn mới", Tấm ưng and Tôi.
 *
 * Tấm ưng has no screen until Phase 3 (D15's F3 scope): it renders as a
 * disabled `<span>`, never a link, so it can't be tapped or focused into
 * a route that doesn't exist yet.
 */
export function BottomTabs({ userInitial, className }: BottomTabsProps) {
  const pathname = usePathname();
  const t = useTranslations("appShell");

  const current = (href: string) => (pathname === href ? ("page" as const) : undefined);

  return (
    <nav className={cx(styles.tabbar, className)} aria-label={t("navLabel")}>
      <Link href="/" aria-current={current("/")} className={styles.tab}>
        <Icon name="roll" size={20} />
        <span>{t("nav.shelf")}</span>
      </Link>
      <Link href="/bag" aria-current={current("/bag")} className={styles.tab}>
        <Icon name="camera" size={20} />
        <span>{t("nav.bag")}</span>
      </Link>
      <Link href="/rolls/new" aria-current={current("/rolls/new")} className={styles.tab}>
        <span className={styles.newTab} aria-hidden="true">
          <PlusIcon />
        </span>
        <span>{t("nav.newRoll")}</span>
      </Link>
      <span className={cx(styles.tab, styles.tabDisabled)} aria-disabled="true">
        <Icon name="keeper" size={20} />
        <span>{t("nav.keepers")}</span>
      </span>
      <Link href="/profile" aria-current={current("/profile")} className={styles.tab}>
        <span className={styles.avatar} aria-hidden="true">
          {userInitial}
        </span>
        <span>{t("nav.profile")}</span>
      </Link>
    </nav>
  );
}

/** The Home board's "+" glyph on the raised Cuộn mới tab: not one of the design system's named icons. */
function PlusIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
