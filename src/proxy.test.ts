import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const getSessionCookie = vi.hoisted(() => vi.fn());

vi.mock("better-auth/cookies", () => ({ getSessionCookie }));

import { config, proxy } from "./proxy";

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

function redirectPathname(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("proxy", () => {
  it("lets a signed-in request through to a protected route", () => {
    getSessionCookie.mockReturnValue("a-session-token");

    const response = proxy(makeRequest("/"));

    expect(redirectPathname(response)).toBeNull();
  });

  it("redirects a signed-out request on a protected route to /sign-in", () => {
    getSessionCookie.mockReturnValue(null);

    const response = proxy(makeRequest("/shelf"));

    expect(response.status).toBe(307);
    expect(redirectPathname(response)).toBe("/sign-in");
  });

  it("redirects a signed-in request on /sign-in home", () => {
    getSessionCookie.mockReturnValue("a-session-token");

    const response = proxy(makeRequest("/sign-in"));

    expect(redirectPathname(response)).toBe("/");
  });

  it("lets a signed-out request through to a public page", () => {
    getSessionCookie.mockReturnValue(null);

    const response = proxy(makeRequest("/sign-in"));

    expect(redirectPathname(response)).toBeNull();
  });

  it("reads the session with an optimistic cookie check, not a DB round trip", () => {
    getSessionCookie.mockReturnValue(null);

    const request = makeRequest("/shelf");
    proxy(request);

    expect(getSessionCookie).toHaveBeenCalledWith(request);
  });

  it("excludes Next internals and static files from the matcher", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ]);
  });
});
