import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { uuid_ossp } from "@electric-sql/pglite/contrib/uuid_ossp";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";

import * as schema from "./schema";

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
 */
export async function createTestDb() {
  const client = new PGlite({ extensions: { pg_trgm, uuid_ossp } });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  return { db, client };
}

export type TTestDb = Awaited<ReturnType<typeof createTestDb>>["db"];
