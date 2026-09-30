"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cx } from "@/design-system/cx";
import { shouldHideShellChrome } from "./hidden-routes";
import styles from "./PhoneTopBar.module.css";

export interface PhoneTopBarProps {
  /** Uppercase first letter of the signed-in user's name, for the avatar. */
  userInitial: string;
  className?: string;
}

/**
 * G1: phone chrome (below 1024px, see `AppShell`), from the `Home` /
 * `Bag` boards — the "Cuộn" wordmark and the avatar linking to `/profile`.
 * `TopNav` covers the same row at 1024px and up, with its extra nav links
 * and "Cuộn mới" button that the phone gets from `BottomTabs` instead.
 *
 * G4/N2: renders nothing on the same focused-flow routes as `BottomTabs`
 * — those pages build their own close header (W2) — and on `/profile`,
 * whose board starts with its own "Hồ sơ" row (the tab bar stays).
 */
export function PhoneTopBar({ userInitial, className }: PhoneTopBarProps) {
  const pathname = usePathname();
  const t = useTranslations("appShell");

  // The Profile board draws its own "Hồ sơ" + theme toggle row instead;
  // the avatar here would only link back to the page you're on.
  if (shouldHideShellChrome(pathname) || pathname === "/profile") return null;

  return (
    <div className={cx(styles.bar, className)}>
      <Link href="/" className={styles.wordmark}>
        {t("wordmark")}
      </Link>
      <Link href="/profile" aria-label={t("avatarAlt")} className={styles.avatar}>
        {userInitial}
      </Link>
    </div>
  );
}
