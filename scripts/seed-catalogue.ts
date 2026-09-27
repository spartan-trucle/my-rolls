import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { and, eq, isNull, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";
import { camera, stock } from "../src/db/schema";
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
 * Upserts on `slug`, scoped to seeded rows (`owner_id IS NULL`, D9/D10) —
 * a plain select-then-insert-or-update rather than `ON CONFLICT`, since the
 * unique index this natural key backs is partial (`stock_slug_idx`,
 * `camera_slug_idx`) and Postgres requires the same partial predicate on
 * the conflict target, which drizzle's `onConflictDoUpdate` can express
 * but a plain read-then-write is simpler to reason about for ~150 rows
 * run once per build.
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
      .select({ id: stock.id })
      .from(stock)
      .where(and(eq(stock.slug, row.slug), isNull(stock.ownerId)))
      .limit(1);

    if (existing[0]) {
      await db.update(stock).set(values).where(eq(stock.id, existing[0].id));
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
      .select({ id: camera.id })
      .from(camera)
      .where(and(eq(camera.slug, row.slug), isNull(camera.ownerId)))
      .limit(1);

    if (existing[0]) {
      await db.update(camera).set(values).where(eq(camera.id, existing[0].id));
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

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(import.meta.dirname, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8")) as T;
}

/**
 * CLI entry point (`pnpm db:seed`, and `vercel-build` after `db:migrate`).
 * Only runs when this file is executed directly — importing it for tests
 * (`seed-catalogue.test.ts`) must not touch the real database or `@/env`.
 */
async function main() {
  loadEnvConfig(process.cwd(), true);
  // Imported lazily: `src/db/client` reads `@/env` at call time, which
  // must not happen just by importing this module for tests.
  const { getDb } = await import("../src/db/client");

  const stockRows = readJson<TStockSeed[]>("../data/catalogue/stocks.json");
  const cameraRows = readJson<TCameraSeed[]>("../data/catalogue/cameras.json");

  await seedCatalogue(getDb(), stockRows, cameraRows);

  process.stdout.write(
    `Seeded ${stockRows.length} stocks and ${cameraRows.length} cameras.\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`Seed failed: ${err instanceof Error ? err.stack : err}\n`);
    process.exitCode = 1;
  });
}
