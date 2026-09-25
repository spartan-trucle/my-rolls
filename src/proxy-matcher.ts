/**
 * Regex source for `proxy.ts`'s `config.matcher`: skip Next's own internals
 * and any request for a file with an extension — images and fonts under
 * `public/` (Stage F's sample photos), `favicon.ico`, `robots.txt`,
 * `sitemap.xml`, and anything else static. This is Next's own documented
 * "negative match" shape (`node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/proxy.md#matcher`). `/api/*` routes have no file
 * extension, so they stay gated exactly as before — `proxy-decision.ts`'s
 * own `PUBLIC_PREFIXES` is what makes `/api/auth` and `/api/health` public,
 * not this matcher.
 */
export const PROXY_MATCHER = "/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)";

/**
 * The same decision `config.matcher` makes at the framework level, as a
 * plain predicate — lets the matcher's behaviour be asserted directly in a
 * unit test, without going through Next's own path-to-regexp/matcher
 * machinery (which only runs for real inside `next dev`/`next build`).
 */
export function isGatedPath(pathname: string): boolean {
  return new RegExp(`^${PROXY_MATCHER}`).test(pathname);
}
