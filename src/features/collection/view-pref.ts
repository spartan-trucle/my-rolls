/** COL-1, COL-3, plan D6–D7: the URL wins, then the cookie, then the default. */
export const ROLL_VIEW_COOKIE = "cuon_roll_view";
export const LIBRARY_VIEW_COOKIE = "cuon_library_view";
export type TRollView = "strip" | "grid";
export type TLibraryView = "shelf" | "grid";

function pick<T extends string>(allowed: readonly T[], fallback: T, ...candidates: unknown[]): T {
  for (const c of candidates) if (typeof c === "string" && (allowed as readonly string[]).includes(c)) return c as T;
  return fallback;
}

export function resolveRollView(query: unknown, cookie: unknown): TRollView {
  return pick(["strip", "grid"], "strip", query, cookie);
}

export function resolveLibraryView(query: unknown, cookie: unknown): TLibraryView {
  return pick(["shelf", "grid"], "shelf", query, cookie);
}

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Ruling R31: the `document.cookie` string ViewSwitch writes on a switch. Written on the client,
 * not by a Server Action, so Next doesn't re-render the page being left before the push. A view
 * that isn't one of the surface's stores its default.
 */
export function viewCookie(surface: "roll" | "library", view: string): string {
  const [name, value] = surface === "roll" ? [ROLL_VIEW_COOKIE, resolveRollView(view, undefined)] : [LIBRARY_VIEW_COOKIE, resolveLibraryView(view, undefined)];
  return `${name}=${value}; max-age=${YEAR_IN_SECONDS}; path=/; samesite=lax`;
}
