import { afterEach, describe, expect, it, vi } from "vitest";

const socialSignIn = vi.hoisted(() => vi.fn().mockResolvedValue({ data: null, error: null }));

vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn().mockReturnValue({
    signIn: { social: socialSignIn },
    signOut: vi.fn(),
    useSession: vi.fn(),
  }),
}));

import {
  buildSocialSignInFetchOptions,
  shouldSkipOAuthProxy,
  signInWithGoogle,
} from "./auth-client";

describe("shouldSkipOAuthProxy", () => {
  it("is true for localhost", () => {
    expect(shouldSkipOAuthProxy("http://localhost:3000")).toBe(true);
  });

  it("is true for this branch's stable alias", () => {
    expect(
      shouldSkipOAuthProxy(
        "https://my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app",
      ),
    ).toBe(true);
  });

  it("is false for another preview deployment with no registered redirect URI", () => {
    expect(
      shouldSkipOAuthProxy("https://my-rolls-abc123-ngantrucles-projects.vercel.app"),
    ).toBe(false);
  });

  it("is false for production (oAuthProxy already skips it there by comparing to productionURL)", () => {
    expect(shouldSkipOAuthProxy("https://my-rolls-weld.vercel.app")).toBe(false);
  });
});

describe("buildSocialSignInFetchOptions", () => {
  it("returns the skip header for a direct origin", () => {
    expect(buildSocialSignInFetchOptions("http://localhost:3000")).toEqual({
      headers: { "x-skip-oauth-proxy": "1" },
    });
  });

  it("returns undefined for a non-direct origin, so oAuthProxy applies", () => {
    expect(
      buildSocialSignInFetchOptions("https://my-rolls-abc123-ngantrucles-projects.vercel.app"),
    ).toBeUndefined();
  });

  it("returns undefined when the origin is unknown (e.g. no window)", () => {
    expect(buildSocialSignInFetchOptions(undefined)).toBeUndefined();
  });
});

describe("signInWithGoogle", () => {
  afterEach(() => {
    socialSignIn.mockClear();
  });

  it("calls signIn.social with the Google provider and both callback URLs (D16)", async () => {
    await signInWithGoogle();

    expect(socialSignIn).toHaveBeenCalledWith(
      {
        provider: "google",
        callbackURL: "/",
        newUserCallbackURL: "/sign-up/profile",
      },
      expect.anything(),
    );
  });

  it("skips the proxy on localhost, jsdom's default test origin", async () => {
    await signInWithGoogle();

    const [, fetchOptions] = socialSignIn.mock.calls.at(-1)!;
    expect(fetchOptions).toEqual({ headers: { "x-skip-oauth-proxy": "1" } });
  });

  it("does not skip the proxy on an origin without its own registered redirect URI", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { ...original, origin: "https://my-rolls-abc123-ngantrucles-projects.vercel.app" },
      configurable: true,
    });

    try {
      await signInWithGoogle();
      const [, fetchOptions] = socialSignIn.mock.calls.at(-1)!;
      expect(fetchOptions).toBeUndefined();
    } finally {
      Object.defineProperty(window, "location", { value: original, configurable: true });
    }
  });
});
