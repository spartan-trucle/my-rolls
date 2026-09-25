import { createAuthClient } from "better-auth/react";

import { DIRECT_OAUTH_ORIGINS } from "./auth-shared";

export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;

/**
 * True when `origin` already has its own registered Google redirect URI
 * (`DIRECT_OAUTH_ORIGINS` in `auth-shared.ts`: localhost, and this
 * branch's stable Vercel alias). Sign-in from these origins should skip
 * the server's `oAuthProxy` plugin (`src/lib/auth.ts`) — routing through
 * production would fail before production has ever run this code.
 */
export function shouldSkipOAuthProxy(origin: string): boolean {
  return DIRECT_OAUTH_ORIGINS.includes(origin);
}

/**
 * Fetch options for the social sign-in call: the header `oAuthProxy`
 * checks for (`x-skip-oauth-proxy`) when `origin` is a direct one,
 * otherwise `undefined` so the proxy applies normally.
 */
export function buildSocialSignInFetchOptions(
  origin: string | undefined,
): { headers: Record<string, string> } | undefined {
  if (!origin || !shouldSkipOAuthProxy(origin)) return undefined;
  return { headers: { "x-skip-oauth-proxy": "1" } };
}

/**
 * The single Google sign-in call both the sign-in and sign-up screens use
 * (D16): Google-only auth has no separate sign-up, so Better Auth tells
 * new and returning users apart itself, via `newUserCallbackURL`.
 */
export function signInWithGoogle() {
  const origin = typeof window === "undefined" ? undefined : window.location.origin;

  return authClient.signIn.social(
    { provider: "google", callbackURL: "/", newUserCallbackURL: "/sign-up/profile" },
    buildSocialSignInFetchOptions(origin),
  );
}
