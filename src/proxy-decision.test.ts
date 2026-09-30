import { describe, expect, it } from "vitest";
import { decideProxyAccess } from "./proxy-decision";

describe("decideProxyAccess", () => {
  describe("signed out", () => {
    const signedIn = false;

    it.each(["/", "/sign-in", "/sign-up", "/terms", "/privacy"])(
      "allows the public page %s",
      (pathname) => {
        expect(decideProxyAccess(pathname, signedIn)).toEqual({ type: "allow" });
      },
    );

    it.each(["/api/auth/get-session", "/api/auth/sign-in/social", "/api/auth/callback/google"])(
      "allows %s under /api/auth (Better Auth's own routes)",
      (pathname) => {
        expect(decideProxyAccess(pathname, signedIn)).toEqual({ type: "allow" });
      },
    );

    it("allows /api/health", () => {
      expect(decideProxyAccess("/api/health", signedIn)).toEqual({ type: "allow" });
    });

    it("allows /api/cron/* (Vercel Cron has no session; the route checks CRON_SECRET)", () => {
      expect(decideProxyAccess("/api/cron/cleanup-uploads", signedIn)).toEqual({ type: "allow" });
    });

    it.each(["/dev/design-system", "/dev/anything/nested"])("allows %s under /dev", (pathname) => {
      expect(decideProxyAccess(pathname, signedIn)).toEqual({ type: "allow" });
    });

    it.each(["/api/dev/boom", "/api/dev/anything"])(
      "sends %s to /sign-in (not a public route)",
      (pathname) => {
        expect(decideProxyAccess(pathname, signedIn)).toEqual({
          type: "redirect",
          to: "/sign-in",
        });
      },
    );

    it.each(["/spike/og", "/spike/share"])(
      "sends %s to /sign-in (spike routes removed after Phase 0)",
      (pathname) => {
        expect(decideProxyAccess(pathname, signedIn)).toEqual({
          type: "redirect",
          to: "/sign-in",
        });
      },
    );

    it("sends /sign-up/profile to /sign-in (it's not public)", () => {
      expect(decideProxyAccess("/sign-up/profile", signedIn)).toEqual({
        type: "redirect",
        to: "/sign-in",
      });
    });

    it("sends /profile to /sign-in (F4: behind sign-in like every other app page)", () => {
      expect(decideProxyAccess("/profile", signedIn)).toEqual({
        type: "redirect",
        to: "/sign-in",
      });
    });

    it("sends any other protected route to /sign-in", () => {
      expect(decideProxyAccess("/shelf", signedIn)).toEqual({
        type: "redirect",
        to: "/sign-in",
      });
    });
  });

  describe("signed in", () => {
    const signedIn = true;

    it("sends /sign-in home", () => {
      expect(decideProxyAccess("/sign-in", signedIn)).toEqual({ type: "redirect", to: "/" });
    });

    it("sends /sign-up home", () => {
      expect(decideProxyAccess("/sign-up", signedIn)).toEqual({ type: "redirect", to: "/" });
    });

    it("does not redirect /sign-up/profile (only /sign-up exactly redirects)", () => {
      expect(decideProxyAccess("/sign-up/profile", signedIn)).toEqual({ type: "allow" });
    });

    it("allows /", () => {
      expect(decideProxyAccess("/", signedIn)).toEqual({ type: "allow" });
    });

    it("allows any other route", () => {
      expect(decideProxyAccess("/shelf", signedIn)).toEqual({ type: "allow" });
    });
  });
});
