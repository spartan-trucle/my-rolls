import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
});

export type TEnv = z.infer<typeof envSchema>;

/**
 * Validates a set of environment variables against the schema above.
 * Pure function so it can be unit tested without touching `process.env`.
 */
export function loadEnv(
  source: Record<string, string | undefined>,
): TEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const missingKeys = result.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");

    throw new Error(`Invalid environment variables: ${missingKeys}`);
  }

  return result.data;
}

let cachedEnv: TEnv | null = null;

/**
 * Validates `process.env` the first time it's called, not at import time.
 * That lets `@/env` be imported safely even when the required keys aren't
 * set yet (Next's Development environment no longer carries `DATABASE_URL`,
 * so `next build` must not fail just by loading this module). The result
 * is memoized so repeat calls return the same object and don't re-validate.
 */
export function getEnv(): TEnv {
  if (!cachedEnv) {
    cachedEnv = loadEnv(process.env);
  }

  return cachedEnv;
}
