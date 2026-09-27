import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";

/**
 * Same generic-over-the-driver shape as `scripts/seed-catalogue.ts`'s
 * `TDbOrTx`: every query and Server Action core function in `features/`
 * takes this instead of a concrete driver type, so the same function runs
 * against PGlite in tests (D21) and the pooled Postgres driver
 * (`src/db/client.ts`) in production, and against a `db.transaction()`
 * callback's `tx` in either — `PgTransaction` extends `PgDatabase` with
 * the same generics, so it satisfies this type too.
 */
export type TSchema = typeof schema;
type TRelations = ExtractTablesWithRelations<TSchema>;

export type TDb<TQueryResult extends PgQueryResultHKT = PgQueryResultHKT> = PgDatabase<
  TQueryResult,
  TSchema,
  TRelations
>;
