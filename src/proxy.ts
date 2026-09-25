import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decideProxyAccess } from "./proxy-decision";

/**
 * Route gate (Next 16's name for middleware — `middleware.ts` is
 * deprecated). `getSessionCookie` is an optimistic check: it only reads
 * whether the session cookie is present, no DB round trip, so this stays
 * fast on every request. Pages that actually need the session (or need to
 * reject a stale/expired one) still call Better Auth's real session check
 * server-side.
 */
export function proxy(request: NextRequest) {
  const isSignedIn = getSessionCookie(request) !== null;
  const decision = decideProxyAccess(request.nextUrl.pathname, isSignedIn);

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Runs on every route except Next's own internals and common static
  // files — matches Next's documented negative-matching example.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
