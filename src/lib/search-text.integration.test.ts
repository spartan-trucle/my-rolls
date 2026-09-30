import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "./search-text";

/**
 * D8, B2: `toSearchText()` fills `search_text` on write, and the same
 * function normalises the query — this is the accent-free match CAT-1 and
 * LAB-1 need ("da lat" finds "Đà Lạt"), proven against the real trigram
 * GIN index from migration 0002 (D21), not just the pure function.
 */
describe("toSearchText against a trigram index", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("matches a Vietnamese city name typed without accents", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.execute(
      sql`INSERT INTO lab (name, search_text) VALUES ('Cinephile FilmLab', ${toSearchText("Cinephile FilmLab · Đà Lạt")})`,
    );

    const query = toSearchText("da lat");
    const found = await db.execute(
      sql`SELECT name FROM lab WHERE search_text % ${query} OR search_text ILIKE ${"%" + query + "%"}`,
    );

    expect(found.rows).toEqual([{ name: "Cinephile FilmLab" }]);
  });

  it("matches Ilford HP5+ without matching plain HP5 rows the same way", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.execute(
      sql`INSERT INTO stock (brand, name, search_text) VALUES ('Ilford', 'HP5 Plus', ${toSearchText("Ilford HP5+")})`,
    );

    const found = await db.execute(
      sql`SELECT name FROM stock WHERE search_text ILIKE ${"%" + toSearchText("hp5+") + "%"}`,
    );

    expect(found.rows).toEqual([{ name: "HP5 Plus" }]);
  });
});
