import { betterAuth } from "better-auth/minimal";
import { describe, expect, it } from "vitest";
import { PRODUCTION_URL, TRUSTED_ORIGINS } from "./auth-shared";

/**
 * `TRUSTED_ORIGINS` feeds `betterAuth`'s `trustedOrigins` option (`auth.ts`),
 * which gates `oAuthProxy`'s encrypted session hand-off (see the comment on
 * `trustedOrigins` in `auth.ts`) — so this list must stay narrow: this
 * project's own preview deployments, never every `*.vercel.app` on the
 * team's Vercel scope (Stage D review, 25.09.2026).
 */
describe("TRUSTED_ORIGINS", () => {
  it("is exactly localhost, production, and this project's preview wildcard", () => {
    expect(TRUSTED_ORIGINS).toEqual([
      "http://localhost:3000",
      PRODUCTION_URL,
      "https://my-rolls-*-ngantrucles-projects.vercel.app",
    ]);
  });
});

/**
 * Exercises Better Auth's own origin-pattern matcher (`isTrustedOrigin` on
 * `$context`, the wildcard matcher `trusted-origins.mjs` uses internally)
 * against `TRUSTED_ORIGINS`, rather than reimplementing the glob logic here.
 * `matchesOriginPattern`/`wildcardMatch` aren't exported through Better
 * Auth's package exports map, so this goes through `$context.isTrustedOrigin`
 * instead — the typed, public equivalent (`@better-auth/core`'s
 * `AuthContext`). A bare `betterAuth({ trustedOrigins })` instance is enough:
 * matching doesn't depend on the database, Google credentials or any of the
 * rest of `auth.ts`'s config, already covered by `auth.test.ts`.
 */
describe("TRUSTED_ORIGINS wildcard matching", () => {
  it("trusts this project's preview origins", async () => {
    const auth = betterAuth({ trustedOrigins: TRUSTED_ORIGINS });
    const ctx = await auth.$context;

    expect(
      ctx.isTrustedOrigin(
        "https://my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app",
      ),
    ).toBe(true);
    expect(
      ctx.isTrustedOrigin("https://my-rolls-ockgtwsl3-ngantrucles-projects.vercel.app"),
    ).toBe(true);
  });

  it("does not trust another project's preview, the bare team scope, or a look-alike suffix", async () => {
    const auth = betterAuth({ trustedOrigins: TRUSTED_ORIGINS });
    const ctx = await auth.$context;

    expect(ctx.isTrustedOrigin("https://evil-ngantrucles-projects.vercel.app")).toBe(false);
    expect(ctx.isTrustedOrigin("https://ngantrucles-projects.vercel.app")).toBe(false);
    expect(
      ctx.isTrustedOrigin("https://my-rolls-x-ngantrucles-projects.vercel.app.evil.com"),
    ).toBe(false);
  });
});
