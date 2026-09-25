import { describe, expect, it } from "vitest";
import { isGatedPath, PROXY_MATCHER } from "./proxy-matcher";

describe("isGatedPath", () => {
  it("gates ordinary app routes", () => {
    expect(isGatedPath("/")).toBe(true);
    expect(isGatedPath("/sign-up/profile")).toBe(true);
    expect(isGatedPath("/sign-in")).toBe(true);
  });

  it("gates API routes (they have no file extension) — proxy-decision.ts's PUBLIC_PREFIXES is what makes /api/auth and /api/health public, not this matcher", () => {
    expect(isGatedPath("/api/health")).toBe(true);
    expect(isGatedPath("/api/auth/callback/google")).toBe(true);
  });

  it("does not gate a request for a file with an extension, e.g. a sample photo (the Stage F bug)", () => {
    expect(isGatedPath("/samples/pine-forest-fog.webp")).toBe(false);
  });

  it("does not gate favicon.ico, robots.txt or sitemap.xml", () => {
    expect(isGatedPath("/favicon.ico")).toBe(false);
    expect(isGatedPath("/robots.txt")).toBe(false);
    expect(isGatedPath("/sitemap.xml")).toBe(false);
  });

  it("does not gate a font file", () => {
    expect(isGatedPath("/fonts/a.woff2")).toBe(false);
  });

  it("does not gate Next's own internals", () => {
    expect(isGatedPath("/_next/static/chunk.js")).toBe(false);
    expect(isGatedPath("/_next/image?url=%2Fsamples%2Fx.webp&w=640&q=75")).toBe(false);
  });
});

describe("PROXY_MATCHER", () => {
  it("is what proxy.ts's config.matcher exports", async () => {
    const { config } = await import("./proxy");

    expect(config.matcher).toEqual([PROXY_MATCHER]);
  });
});
