import "server-only";

import { PRODUCTION_URL } from "./auth-shared";

/**
 * Resolves Better Auth's `baseURL` (`src/lib/auth.ts`) for the environment
 * Next is running in:
 *
 * 1. `BETTER_AUTH_URL`, if set — an explicit override always wins.
 * 2. The production domain, when `VERCEL_ENV === "production"`.
 * 3. `https://${VERCEL_BRANCH_URL}` on Vercel previews — the stable alias
 *    for the branch's deployments, not the one-off per-deployment URL.
 * 4. `http://localhost:3000` otherwise (local dev, or CI with no Vercel
 *    env at all).
 */
export function resolveBaseUrl(env: Record<string, string | undefined>): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_ENV === "production") return PRODUCTION_URL;
  if (env.VERCEL_BRANCH_URL) return `https://${env.VERCEL_BRANCH_URL}`;
  return "http://localhost:3000";
}
