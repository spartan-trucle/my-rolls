"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { cx } from "@/design-system/cx";
import styles from "./ThemeToggle.module.css";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year

/**
 * `data-theme` on `<html>` and the OS `prefers-color-scheme` are state owned
 * outside React, so the toggle reads them with `useSyncExternalStore`
 * instead of copying them into local state inside an effect: the server
 * snapshot ("not dark") is what SSR renders, and the real value lands as
 * soon as the client can read the DOM/`matchMedia`, without a cascading
 * render or a hydration mismatch.
 */
const listeners = new Set<() => void>();

function notifyThemeChanged() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Sun and moon, drawn like the design system's Icon: 24 viewBox, currentColor, round caps. */
function SunIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}

export interface ThemeToggleProps {
  className?: string;
}

/**
 * Paper / Darkroom switch (D21). Reads the effective theme from `<html
 * data-theme>`, falling back to `prefers-color-scheme` when no cookie is
 * set, then flips both the attribute and the cookie on click without a
 * reload.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations("theme");
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function handleClick() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `theme=${next}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
    notifyThemeChanged();
  }

  return (
    <button
      type="button"
      className={cx(styles.toggle, className)}
      aria-pressed={dark}
      aria-label={dark ? t("toggleToLight") : t("toggleToDark")}
      onClick={handleClick}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
