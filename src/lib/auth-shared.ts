/**
 * Auth constants shared between the server (`auth.ts`, `resolve-base-url.ts`)
 * and the client (`auth-client.ts`). No `server-only`: the client needs
 * these too, and neither is a secret.
 *
 * Until the roadmap domain decision (D3, due 11.10.2026) these are the
 * literal origins Google's OAuth client has registered as redirect URIs
 * (Stage D of the phase 0 plan) — production, and this branch's stable
 * Vercel alias. Only origins other than these two need Better Auth's
 * `oAuthProxy` plugin (D8).
 */
export const PRODUCTION_URL = "https://my-rolls-weld.vercel.app";

/**
 * Origins with their own registered Google redirect URI, other than
 * production (which `oAuthProxy` already recognises by comparing origins
 * to `PRODUCTION_URL`). Sign-in from these origins skips the proxy, so it
 * works directly without production ever having run this code yet
 * ("Found during Stages A and B" in the phase 0 plan).
 */
export const DIRECT_OAUTH_ORIGINS = [
  "http://localhost:3000",
  "https://my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app",
];
