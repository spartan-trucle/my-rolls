import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { and, eq, isNull, type ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { resolveMigrationDatabaseUrl } from "../src/db/migration-env";
import * as schema from "../src/db/schema";
import { camera, lab, stock } from "../src/db/schema";
import { HOME_DEVELOPMENT_SLUG } from "../src/features/labs/constants";
import { toSearchText } from "../src/lib/search-text";

/**
 * D10, D11: `data/catalogue/{stocks,cameras}.json` are the content track's
 * starter rows ([seed-catalogue.md](../.planning/content/seed-catalogue.md)).
 * Every field here maps 1:1 onto `stock`/`camera` columns (`src/db/schema/catalogue.ts`);
 * `iso`/`exposures` on a single-use camera stay in the doc, not the DB —
 * there's no column for them on `camera` (D20 only needs `fixed_stock_id`).
 */
export interface TStockSeed {
  slug: string;
  brand: string;
  name: string;
  iso?: number;
  formats?: string[];
  type?: string;
  canisterColor?: string;
  status?: string;
}

export interface TCameraSeed {
  slug: string;
  brand: string;
  model: string;
  type?: string;
  format?: string;
  /** D20: resolved to `camera.fixed_stock_id` — must name a seeded stock's slug. */
  fixedStockSlug?: string;
}

type TSchema = typeof schema;
type TRelations = ExtractTablesWithRelations<TSchema>;

/**
 * `PgTransaction` extends `PgDatabase` with the same generics, so typing
 * every helper against `PgDatabase` lets them run standalone or nested
 * inside `seedCatalogue`'s transaction — generic over the query-result
 * kind (`TQueryResult`) so it works against PGlite in tests (D21) and the
 * pooled Postgres driver in production without an `any`.
 */
type TDbOrTx<TQueryResult extends PgQueryResultHKT> = PgDatabase<
  TQueryResult,
  TSchema,
  TRelations
>;

/**
 * Whether any of `values`' keys differ from the same column on the
 * existing row — arrays (`formats`, `services`…) compare by content, not
 * identity. Backs the "a second run changes nothing" guarantee (B3): a
 * row that would be written back unchanged is skipped entirely, so
 * `updated_at` stays put too, not just the visible columns.
 */
function hasChanges<T extends Record<string, unknown>>(
  existingRow: T,
  values: Partial<T>,
): boolean {
  return (Object.keys(values) as (keyof T)[]).some((key) => {
    const before = existingRow[key] ?? null;
    const after = values[key] ?? null;

    if (Array.isArray(before) || Array.isArray(after)) {
      return JSON.stringify(before) !== JSON.stringify(after);
    }

    return before !== after;
  });
}

/**
 * Upserts on `slug`, scoped to seeded rows (`owner_id IS NULL`, D9/D10) —
 * a plain select-then-insert-or-update rather than `ON CONFLICT`, since the
 * unique index this natural key backs is partial (`stock_slug_idx`,
 * `camera_slug_idx`) and Postgres requires the same partial predicate on
 * the conflict target, which drizzle's `onConflictDoUpdate` can express
 * but a plain read-then-write is simpler to reason about for ~150 rows
 * run once per build. `updated_at` is only bumped when a value actually
 * changed, so re-running the seed with the same data is a true no-op.
 */
async function upsertStocks<TQueryResult extends PgQueryResultHKT>(
  db: TDbOrTx<TQueryResult>,
  rows: TStockSeed[],
): Promise<void> {
  for (const row of rows) {
    const values = {
      slug: row.slug,
      brand: row.brand,
      name: row.name,
      iso: row.iso ?? null,
      formats: row.formats ?? null,
      type: row.type ?? null,
      canisterColor: row.canisterColor ?? null,
      status: row.status ?? null,
      searchText: toSearchText(`${row.brand} ${row.name}`),
    };

    const existing = await db
      .select()
      .from(stock)
      .where(and(eq(stock.slug, row.slug), isNull(stock.ownerId)))
      .limit(1);

    if (existing[0]) {
      if (hasChanges(existing[0], values)) {
        await db
          .update(stock)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(stock.id, existing[0].id));
      }
    } else {
      await db.insert(stock).values(values);
    }
  }
}

async function upsertCameras<TQueryResult extends PgQueryResultHKT>(
  db: TDbOrTx<TQueryResult>,
  rows: TCameraSeed[],
): Promise<void> {
  for (const row of rows) {
    let fixedStockId: string | null = null;

    if (row.fixedStockSlug) {
      const foundStock = await db
        .select({ id: stock.id })
        .from(stock)
        .where(and(eq(stock.slug, row.fixedStockSlug), isNull(stock.ownerId)))
        .limit(1);

      if (!foundStock[0]) {
        throw new Error(
          `Seed camera "${row.slug}" names fixedStockSlug "${row.fixedStockSlug}", ` +
            "but no seeded stock has that slug. Add the stock row first (D20).",
        );
      }

      fixedStockId = foundStock[0].id;
    }

    const values = {
      slug: row.slug,
      brand: row.brand,
      model: row.model,
      type: row.type ?? null,
      format: row.format ?? null,
      fixedStockId,
      searchText: toSearchText(`${row.brand} ${row.model}`),
    };

    const existing = await db
      .select()
      .from(camera)
      .where(and(eq(camera.slug, row.slug), isNull(camera.ownerId)))
      .limit(1);

    if (existing[0]) {
      if (hasChanges(existing[0], values)) {
        await db
          .update(camera)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(camera.id, existing[0].id));
      }
    } else {
      await db.insert(camera).values(values);
    }
  }
}

/**
 * B3: stocks first, then cameras (single-use cameras resolve their fixed
 * film's id, D20), inside one transaction — a bad camera row rolls back
 * the whole seed rather than leaving stocks committed without their
 * cameras.
 */
export async function seedCatalogue<TQueryResult extends PgQueryResultHKT>(
  db: TDbOrTx<TQueryResult>,
  stockRows: TStockSeed[],
  cameraRows: TCameraSeed[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await upsertStocks(tx, stockRows);
    await upsertCameras(tx, cameraRows);
  });
}

const HOME_DEVELOPMENT_NAME = "Tự tráng ở nhà";

/**
 * B5 task 4: the labs data layer (`src/features/labs/core.ts`) always
 * pins the built-in home-development lab first, and its tests need the
 * row to exist without depending on B3b's full `labs.json` seed, which
 * lands later on its own branch. Seeded here, on its own — not folded
 * into `seedCatalogue`'s stock/camera transaction, since it's an
 * unrelated table — with the same upsert-on-slug, no-op-if-unchanged
 * shape as `upsertStocks`/`upsertCameras` above. B3b's own seed can
 * still include this slug in `labs.json` later: the upsert is
 * idempotent either way, so the two don't fight over the row.
 *
 * A migration (`0003`) that inserts this one row was the other option
 * (see the plan) — skipped because every migration so far
 * (`drizzle/000*.sql`) is schema-only (D9/D10: seed data belongs in this
 * script, reviewable in PRs, not hand-written into a migration).
 */
export async function seedHomeDevelopmentLab<
  TQueryResult extends PgQueryResultHKT,
>(db: TDbOrTx<TQueryResult>): Promise<void> {
  const values = {
    slug: HOME_DEVELOPMENT_SLUG,
    name: HOME_DEVELOPMENT_NAME,
    searchText: toSearchText(HOME_DEVELOPMENT_NAME),
  };

  const existing = await db
    .select()
    .from(lab)
    .where(and(eq(lab.slug, HOME_DEVELOPMENT_SLUG), isNull(lab.ownerId)))
    .limit(1);

  if (existing[0]) {
    if (hasChanges(existing[0], values)) {
      await db
        .update(lab)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(lab.id, existing[0].id));
    }
  } else {
    await db.insert(lab).values(values);
  }
}

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(import.meta.dirname, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as T;
}

/**
 * CLI entry point (`pnpm db:seed`, and `vercel-build` after `db:migrate`).
 * Only runs when this file is executed directly — importing it for tests
 * (`seed-catalogue.test.ts`) must not touch the real database or `@/env`.
 *
 * Its own short-lived `Pool` over `DATABASE_URL_UNPOOLED` (D10's "always
 * the direct connection for migrate-time work", same as
 * `drizzle.config.ts`), not `src/db/client.ts`'s cached, pooled `getDb()` —
 * that pool is meant to live for the app's lifetime and is never told to
 * end, so a one-shot CLI using it would hang on `pg`'s ~10 s idle timeout
 * instead of exiting. `pool.end()` in `finally` closes it whether the seed
 * succeeds or throws.
 */
async function main() {
  loadEnvConfig(process.cwd(), true);

  const pool = new Pool({
    connectionString: resolveMigrationDatabaseUrl(process.env),
  });
  const db = drizzle(pool, { schema });

  try {
    const stockRows = readJson<TStockSeed[]>("../data/catalogue/stocks.json");
    const cameraRows = readJson<TCameraSeed[]>(
      "../data/catalogue/cameras.json",
    );

    await seedCatalogue(db, stockRows, cameraRows);
    await seedHomeDevelopmentLab(db);

    process.stdout.write(
      `Seeded ${stockRows.length} stocks, ${cameraRows.length} cameras and the home-development lab.\n`,
    );
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(
      `Seed failed: ${err instanceof Error ? err.stack : err}\n`,
    );
    process.exitCode = 1;
  });
}
