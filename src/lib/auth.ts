import "server-only";

import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";

import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getEnv } from "@/env";
import { PRODUCTION_URL, TRUSTED_ORIGINS } from "./auth-shared";
import { resolveBaseUrl } from "./resolve-base-url";

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30; // 30 days (AUTH-1)
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24; // 1 day — Better Auth's own default, spelled out

/**
 * Split out from `getAuth()` so `ReturnType<typeof buildAuth>` below can
 * infer Better Auth's specific, literal options type. Going through
 * `typeof betterAuth` directly instead falls back to its generic default
 * (`BetterAuthOptions`), which the specific instance built here can't
 * assign back into (Better Auth's `Auth<Options>` isn't covariant enough
 * for that).
 */
function buildAuth() {
  return betterAuth({
    baseURL: resolveBaseUrl(process.env),
    // This project's own Vercel preview/branch domains, not the whole team
    // scope (D8, narrowed in the Stage D review — see `TRUSTED_ORIGINS` in
    // `auth-shared.ts`): every preview deploy gets its own URL, and Google
    // has no wildcard redirects.
    trustedOrigins: TRUSTED_ORIGINS,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      // `pg`'s Pool (src/db/client.ts) supports real transactions, unlike
      // the HTTP driver — turn them on so Better Auth's multi-step
      // operations (e.g. sign-up: create user + account) are atomic.
      transaction: true,
    }),
    socialProviders: {
      google: {
        clientId: getEnv().GOOGLE_CLIENT_ID,
        clientSecret: getEnv().GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
    },
    plugins: [
      // oAuthProxy's `productionURL` lets sign-in work on every preview
      // deployment once production runs this code (D8): it rewrites the
      // Google redirect through production's registered callback, then
      // production hands the signed-in session back to the preview
      // origin. Requests from `trustedOrigins` above are required for
      // that hand-back (Better Auth only trusts those origins as redirect
      // targets). Origins with their own registered redirect URI
      // (localhost, this branch's alias — `DIRECT_OAUTH_ORIGINS` in
      // `auth-shared.ts`) skip the proxy instead, via the
      // `x-skip-oauth-proxy` request header `auth-client.ts` sets for
      // them — so sign-in works there without going through production.
      oAuthProxy({ productionURL: PRODUCTION_URL }),
      // Must be last: it has to see every plugin's `hooks.after` cookies
      // to forward them all to Next's cookie store.
      nextCookies(),
    ],
  });
}

let cachedAuth: ReturnType<typeof buildAuth> | undefined;

/**
 * Better Auth, configured for Google-only sign-in (D-decisions in the
 * phase 0 plan). Lazy and memoized like `getEnv()`/`getDb()`: importing
 * this module (e.g. from the route handler) must not require secrets or
 * open a database connection until an auth request actually arrives —
 * `next build`'s page-data collection imports route modules, and eager
 * validation there once broke local builds (see `src/env.ts`).
 */
export function getAuth(): ReturnType<typeof buildAuth> {
  if (!cachedAuth) {
    cachedAuth = buildAuth();
  }

  return cachedAuth;
}
