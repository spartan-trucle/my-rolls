"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { getIsDarkTheme, getServerIsDarkTheme, setTheme, subscribeToTheme } from "./theme-store";
import styles from "./ThemeSegmented.module.css";

/**
 * Profile settings' "Giao diện" row (F4): the boards' `Sáng / Tối`
 * segmented control, reading and writing the same `theme-store` as
 * `ThemeToggle` — picking either keeps both in sync, no reload.
 */
export function ThemeSegmented() {
  const t = useTranslations("profile");
  const dark = useSyncExternalStore(subscribeToTheme, getIsDarkTheme, getServerIsDarkTheme);

  return (
    <div className={styles.seg} role="group" aria-label={t("themeLabel")}>
      <button type="button" aria-pressed={!dark} onClick={() => setTheme("light")}>
        {t("themeLight")}
      </button>
      <button type="button" aria-pressed={dark} onClick={() => setTheme("dark")}>
        {t("themeDark")}
      </button>
    </div>
  );
}
