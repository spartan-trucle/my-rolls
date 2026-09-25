import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/env";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Pooled Postgres connection for the app's runtime — Better Auth's Drizzle
 * adapter (`src/lib/auth.ts`) reads and writes through this. `pg`'s `Pool`,
 * not `@neondatabase/serverless`'s HTTP driver: the adapter runs its
 * multi-step operations in a real transaction
 * (`drizzleAdapter(..., { transaction: true })`), which the HTTP driver
 * can't do. Uses the pooled `DATABASE_URL`; migrations use the unpooled
 * `DATABASE_URL_UNPOOLED` instead (`drizzle.config.ts`, D10).
 *
 * `attachDatabasePool` (`@vercel/functions`) keeps the function instance
 * alive long enough for idle connections to be removed from the pool
 * instead of leaking across invocations — the documented pattern for `pg`
 * on Vercel Fluid compute.
 *
 * Lazy and memoized like `getEnv()`: importing this module must not
 * require `DATABASE_URL` or open a connection until something queries the
 * database.
 */
export function getDb() {
  if (!cachedDb) {
    const pool = new Pool({ connectionString: getEnv().DATABASE_URL });
    attachDatabasePool(pool);
    cachedDb = drizzle(pool, { schema });
  }

  return cachedDb;
}
