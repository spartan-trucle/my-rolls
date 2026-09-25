/**
 * Pure resolution of the connection string `drizzle-kit generate` and
 * `drizzle-kit migrate` run against. Migrations always use the direct
 * (unpooled) connection (D10) — never the pooled `DATABASE_URL` the app
 * reads through `getEnv()` at runtime. A plain function (not `getEnv()`'s
 * zod schema) because `drizzle.config.ts` runs outside Next, before
 * `@/env`'s schema would even apply to this key.
 */
export function resolveMigrationDatabaseUrl(
  env: Record<string, string | undefined>,
): string {
  const url = env.DATABASE_URL_UNPOOLED;

  if (!url) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is required to run migrations. Locally it comes " +
        "from .env.development.local (D23); in the Vercel build it's set by " +
        "the Neon integration.",
    );
  }

  return url;
}
