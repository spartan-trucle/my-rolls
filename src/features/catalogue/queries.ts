import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { camera, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { POPULAR_CAMERA_SLUGS, POPULAR_STOCK_SLUGS } from "@/features/catalogue/popularSlugs";
import { toSearchText } from "@/lib/search-text";

const DEFAULT_LIMIT = 20;

// D8: below this, a match only counts if `ILIKE %q%` also hits — pure
// trigram similarity is too noisy for very short queries ("fm" would
// otherwise pull in unrelated stocks that merely share a few trigrams).
const SIMILARITY_THRESHOLD = 0.1;

export type TCatalogueKind = "stock" | "camera";

export interface ISearchCatalogueInput {
  kind: TCatalogueKind;
  q: string;
  userId: string;
  limit?: number;
}

export type TStockEntry = { kind: "stock" } & typeof stock.$inferSelect;
export type TCameraEntry = { kind: "camera" } & typeof camera.$inferSelect;
export type TCatalogueEntry = TStockEntry | TCameraEntry;

async function searchStocks<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  normalizedQ: string,
  userId: string,
  limit: number,
): Promise<TStockEntry[]> {
  const similarity = sql<number>`similarity(${stock.searchText}, ${normalizedQ})`;

  const rows = await db
    .select()
    .from(stock)
    .where(
      and(
        isNull(stock.deletedAt),
        or(isNull(stock.ownerId), eq(stock.ownerId, userId)),
        or(ilike(stock.searchText, `%${normalizedQ}%`), sql`${similarity} > ${SIMILARITY_THRESHOLD}`),
      ),
    )
    .orderBy(desc(similarity), asc(stock.brand), asc(stock.name))
    .limit(limit);

  return rows.map((row) => ({ kind: "stock" as const, ...row }));
}

async function searchCameras<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  normalizedQ: string,
  userId: string,
  limit: number,
): Promise<TCameraEntry[]> {
  const similarity = sql<number>`similarity(${camera.searchText}, ${normalizedQ})`;

  const rows = await db
    .select()
    .from(camera)
    .where(
      and(
        isNull(camera.deletedAt),
        or(isNull(camera.ownerId), eq(camera.ownerId, userId)),
        or(
          ilike(camera.searchText, `%${normalizedQ}%`),
          sql`${similarity} > ${SIMILARITY_THRESHOLD}`,
        ),
      ),
    )
    .orderBy(desc(similarity), asc(camera.brand), asc(camera.model))
    .limit(limit);

  return rows.map((row) => ({ kind: "camera" as const, ...row }));
}

async function listStocks<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  limit: number,
): Promise<TStockEntry[]> {
  const ownRows = await db
    .select()
    .from(stock)
    .where(and(isNull(stock.deletedAt), eq(stock.ownerId, userId)))
    .orderBy(asc(stock.brand), asc(stock.name));

  const seenIds = new Set(ownRows.map((row) => row.id));

  const popularRows = await db
    .select()
    .from(stock)
    .where(and(isNull(stock.deletedAt), isNull(stock.ownerId), inArray(stock.slug, POPULAR_STOCK_SLUGS)));
  const popularBySlug = new Map(popularRows.map((row) => [row.slug, row]));
  const popularOrdered = POPULAR_STOCK_SLUGS.flatMap((slug) => {
    const row = popularBySlug.get(slug);
    if (!row || seenIds.has(row.id)) return [];
    seenIds.add(row.id);
    return [row];
  });

  const restRows = await db
    .select()
    .from(stock)
    .where(and(isNull(stock.deletedAt), isNull(stock.ownerId)))
    .orderBy(asc(stock.brand), asc(stock.name))
    .limit(limit);
  const restOrdered = restRows.filter((row) => !seenIds.has(row.id));

  return [...ownRows, ...popularOrdered, ...restOrdered].slice(0, limit).map((row) => ({ kind: "stock" as const, ...row }));
}

async function listCameras<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  limit: number,
): Promise<TCameraEntry[]> {
  const ownRows = await db
    .select()
    .from(camera)
    .where(and(isNull(camera.deletedAt), eq(camera.ownerId, userId)))
    .orderBy(asc(camera.brand), asc(camera.model));

  const seenIds = new Set(ownRows.map((row) => row.id));

  const popularRows = await db
    .select()
    .from(camera)
    .where(and(isNull(camera.deletedAt), isNull(camera.ownerId), inArray(camera.slug, POPULAR_CAMERA_SLUGS)));
  const popularBySlug = new Map(popularRows.map((row) => [row.slug, row]));
  const popularOrdered = POPULAR_CAMERA_SLUGS.flatMap((slug) => {
    const row = popularBySlug.get(slug);
    if (!row || seenIds.has(row.id)) return [];
    seenIds.add(row.id);
    return [row];
  });

  const restRows = await db
    .select()
    .from(camera)
    .where(and(isNull(camera.deletedAt), isNull(camera.ownerId)))
    .orderBy(asc(camera.brand), asc(camera.model))
    .limit(limit);
  const restOrdered = restRows.filter((row) => !seenIds.has(row.id));

  return [...ownRows, ...popularOrdered, ...restOrdered].slice(0, limit).map((row) => ({ kind: "camera" as const, ...row }));
}

export interface IListCatalogueInput {
  kind: TCatalogueKind;
  userId: string;
  limit?: number;
}

/**
 * CAT-1's "list before typing" fix (D1 review): `CataloguePicker` shows
 * this instead of a bare hint until the caller types something. Order is
 * the caller's own custom entries first (most likely to want what's
 * already private to them), then the curated `POPULAR_*_SLUGS` order
 * (`popularSlugs.ts`, same order F1's onboarding chips use), then every
 * other seeded row by brand/name — capped at `limit` (20 by default), same
 * as `searchCatalogue`. Excludes soft-deleted rows and never another
 * user's private entry, same privacy rules as `searchCatalogue`.
 */
export async function listCatalogue<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  input: IListCatalogueInput,
): Promise<TCatalogueEntry[]> {
  const limit = input.limit ?? DEFAULT_LIMIT;

  return input.kind === "stock" ? listStocks(db, input.userId, limit) : listCameras(db, input.userId, limit);
}

/**
 * CAT-1: seeded rows (`owner_id IS NULL`) plus `userId`'s own private
 * rows, never another user's, excluding soft-deleted rows — matched
 * against `search_text` with `toSearchText(q)` so the query side can't
 * drift from what B2's write side stored (D8). Ranked by trigram
 * similarity, then brand and name/model, capped at `limit` (20 by
 * default).
 *
 * An empty (or all-whitespace) `q` returns nothing: the picker shows the
 * bag first (CAT-1) and only searches the catalogue once the user types.
 */
export async function searchCatalogue<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  input: ISearchCatalogueInput,
): Promise<TCatalogueEntry[]> {
  const q = input.q.trim();
  if (q.length === 0) return [];

  const normalizedQ = toSearchText(q);
  const limit = input.limit ?? DEFAULT_LIMIT;

  return input.kind === "stock"
    ? searchStocks(db, normalizedQ, input.userId, limit)
    : searchCameras(db, normalizedQ, input.userId, limit);
}

export interface IGetCatalogueBySlugsInput {
  kind: TCatalogueKind;
  slugs: readonly string[];
}

/**
 * F1's curated onboarding chips (`POPULAR_CAMERA_SLUGS` /
 * `POPULAR_STOCK_SLUGS`): the seeded rows (`owner_id IS NULL`, never a
 * private entry) matching `slugs`, excluding soft-deleted rows — in the
 * same order as `slugs` itself, so the board's curated order survives a
 * DB round trip; a slug the seed data doesn't have (yet) is silently
 * dropped rather than shown as a gap.
 */
export async function getCatalogueBySlugs<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  input: IGetCatalogueBySlugsInput,
): Promise<TCatalogueEntry[]> {
  if (input.slugs.length === 0) return [];

  if (input.kind === "stock") {
    const rows = await db
      .select()
      .from(stock)
      .where(and(isNull(stock.deletedAt), isNull(stock.ownerId), inArray(stock.slug, input.slugs)));

    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    return input.slugs.flatMap((slug) => {
      const row = bySlug.get(slug);
      return row ? [{ kind: "stock" as const, ...row }] : [];
    });
  }

  const rows = await db
    .select()
    .from(camera)
    .where(and(isNull(camera.deletedAt), isNull(camera.ownerId), inArray(camera.slug, input.slugs)));

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  return input.slugs.flatMap((slug) => {
    const row = bySlug.get(slug);
    return row ? [{ kind: "camera" as const, ...row }] : [];
  });
}
