import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";

import * as schema from "./schema";

type TDrizzleTestDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * D21: the data layer's tests (B2–B6) run against an in-process Postgres,
 * not the Neon `dev` branch — fast, isolated, offline, and every test gets
 * its own database. PGlite bundles `pg_trgm` (B2's trigram search) and
 * `uuid-ossp` (D9's `uuid_generate_v4()` ids) as contrib modules, so both
 * load without a network call or a Docker Postgres; a smoke check lives in
 * `test-db.test.ts`.
 *
 * The real migrations (`drizzle/000*.sql`, including 0002's
 * `CREATE EXTENSION` statements) are applied here — not a hand-rolled
 * schema push — so a schema/migration drift fails a test instead of only
 * showing up against Neon.
 *
 * Perf: booting a fresh PGlite and replaying every migration costs
 * ~0.7–1s, and some suites call `createTestDb()` 15–20 times in one file.
 * Doing that cold boot per test, times Vitest's default worker count (one
 * per CPU), is what pushed suites past their timeout when the full suite
 * ran together — they passed alone or with `--maxWorkers=2`. So the
 * migrated PGlite instance is built once per Vitest worker process (the
 * cache below) and reused; isolation between tests comes from wiping the
 * public schema's rows, not from re-running migrations. `client.close()`
 * — every existing test's `afterEach` cleanup — is repurposed to do that
 * wipe instead of actually tearing PGlite down, so callers don't change.
 * The real instance is only ever freed when the worker process exits.
 */
let cached: Promise<{ client: PGlite; db: TDrizzleTestDb }> | undefined;

async function getMigratedInstance() {
  cached ??= (async () => {
    const client = new PGlite({ extensions: { pg_trgm, uuid_ossp } });
    const db = drizzle(client, { schema });

    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

    return { client, db };
  })();

  return cached;
}

async function resetData(client: PGlite): Promise<void> {
  const { rows } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  if (rows.length === 0) return;

  const tables = rows.map((row) => `"${row.tablename}"`).join(", ");
  await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

export async function createTestDb() {
  const { client, db } = await getMigratedInstance();

  // Every test starts from a clean, already-migrated database, regardless
  // of whether the previous test's cleanup ran `client.close()`.
  await resetData(client);

  // `close` is monkey-patched on the shared instance (once is enough — a
  // repeat assignment is harmless) so existing `cleanup = () =>
  // client.close()` callers reset the data instead of shutting PGlite
  // down. Real methods like `client.transaction` are untouched.
  client.close = () => resetData(client);

  return { db, client };
}

export type TTestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
