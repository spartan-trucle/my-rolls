export type TProxyDecision = { type: "allow" } | { type: "redirect"; to: string };

/**
 * Exact-match public pages — reachable while signed out. `/` is the landing
 * page for signed-out visitors; `page.tsx` shows signed-in users their home.
 */
const PUBLIC_PATHS = new Set(["/", "/sign-in", "/sign-up", "/terms", "/privacy"]);

/** Public path prefixes — Better Auth's own routes, health checks, dev tools. */
const PUBLIC_PREFIXES = ["/api/auth", "/api/health", "/dev"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Pure decision for `proxy.ts`'s route gate — no cookies, no request, so
 * it's trivial to exhaust every case in a test. `proxy.ts` does the actual
 * (optimistic) session-cookie read and turns this into a `NextResponse`.
 *
 * Next internals (`_next/*`) and static files are excluded by `proxy.ts`'s
 * own `matcher`, not here — this function never sees them.
 */
export function decideProxyAccess(pathname: string, isSignedIn: boolean): TProxyDecision {
  if (isSignedIn) {
    // Signed-in users land on `/sign-in` or `/sign-up` right after being
    // there before signing in (e.g. browser back button) — send them
    // home. `/sign-up/profile` is deliberately excluded: a first-time
    // user is meant to land there straight after Google sign-in.
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      return { type: "redirect", to: "/" };
    }
    return { type: "allow" };
  }

  if (isPublicPath(pathname)) return { type: "allow" };

  return { type: "redirect", to: "/sign-in" };
}
