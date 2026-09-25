export type TDataTheme = "light" | "dark" | undefined;

/**
 * Maps the raw `theme` cookie value to the `data-theme` attribute to set on
 * `<html>`. Anything other than exactly "light" or "dark" — including no
 * cookie at all — means "follow the system": no attribute, so tokens.css's
 * `prefers-color-scheme` rule decides.
 */
export function themeCookieToDataTheme(cookieValue: string | undefined): TDataTheme {
  if (cookieValue === "dark") return "dark";
  if (cookieValue === "light") return "light";
  return undefined;
}
