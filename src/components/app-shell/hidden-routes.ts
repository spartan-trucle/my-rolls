/**
 * G4/N2: routes whose page builds its own close ("✕" / "‹ Kệ") header (W2)
 * instead of the phone chrome — focused flows (`NewRoll`, `RollSaved`,
 * `CustomEntry` on the boards) where the tab bar and top bar would eat
 * into the one screen the 60s exit has to fit in. One list here, read by
 * both `BottomTabs` and `PhoneTopBar`, so a new focused route is never a
 * page-specific hack — it's added once, in this file.
 *
 * Matched against the pathname `usePathname()` returns, which is already
 * locale-free (D18: `vi` is the only locale, no `/vi` prefix routing).
 */
const HIDDEN_SHELL_CHROME_ROUTES: RegExp[] = [
  /^\/rolls\/new$/,
  /^\/rolls\/[^/]+$/,
  /^\/rolls\/[^/]+\/edit$/,
];

export function shouldHideShellChrome(pathname: string): boolean {
  return HIDDEN_SHELL_CHROME_ROUTES.some((route) => route.test(pathname));
}
