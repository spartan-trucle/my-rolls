export type TThemeName = "light" | "dark";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year

/**
 * `data-theme` on `<html>` and the OS `prefers-color-scheme` are state
 * owned outside React. `ThemeToggle` and the profile settings' `Sáng /
 * Tối` segmented control both read and write it through this one module
 * — `useSyncExternalStore` instead of local state, so the server snapshot
 * ("not dark") is what SSR renders and the real value lands as soon as
 * the client can read the DOM/`matchMedia`, without a cascading render or
 * a hydration mismatch, and a change from either control notifies the
 * other.
 */
const listeners = new Set<() => void>();

function notifyThemeChanged() {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function getIsDarkTheme(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getServerIsDarkTheme(): boolean {
  return false;
}

/** Sets `<html data-theme>` and the `theme` cookie, and notifies every subscriber (both controls stay in sync without a reload). */
export function setTheme(next: TThemeName): void {
  document.documentElement.setAttribute("data-theme", next);
  document.cookie = `theme=${next}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
  notifyThemeChanged();
}
