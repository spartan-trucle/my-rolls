import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

type TSchema = typeof schema;
type TRelations = ExtractTablesWithRelations<TSchema>;

/**
 * A Drizzle database (or transaction — `PgTransaction` extends
 * `PgDatabase` with the same generics) generic over the query-result kind
 * (`TQueryResult`), so one function signature works against both the
 * pooled `pg` driver in production (`src/db/client.ts`'s `getDb()`) and
 * PGlite in tests (`src/db/test-db.ts`'s `createTestDb()`, D21) without an
 * `any`. Same shape as `scripts/seed-catalogue.ts`'s local `TDbOrTx`,
 * pulled out here so `src/features/*` doesn't have to redeclare it.
 */
export type TDb<TQueryResult extends PgQueryResultHKT = PgQueryResultHKT> =
  PgDatabase<TQueryResult, TSchema, TRelations>;
