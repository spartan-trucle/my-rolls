import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "./test-db";

/**
 * D21: checks the extensions load and the real migrations (0000–0002)
 * apply cleanly, before any B2–B6 test relies on this helper.
 */
describe("createTestDb (D21)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("loads uuid-ossp and pg_trgm, and lets the migrations create tables that use them", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    // uuid-ossp: stock.id defaults to uuid_generate_v4() (D9), not a
    // client-side default — insert without an id and read it back.
    const inserted = await db.execute(
      sql`INSERT INTO stock (brand, name) VALUES ('Kodak', 'Gold 200') RETURNING id`,
    );
    expect(inserted.rows[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    // pg_trgm: the GIN trigram index created in migration 0002 must exist
    // and be usable by a similarity query, not just present in the schema.
    await db.execute(
      sql`UPDATE stock SET search_text = 'kodak gold 200' WHERE id = ${inserted.rows[0]?.id}`,
    );
    const found = await db.execute(
      sql`SELECT id FROM stock WHERE search_text % 'kodak gold' LIMIT 1`,
    );
    expect(found.rows.length).toBe(1);
  });

  it("applies migration 0001's auth tables too, so Better Auth's schema and Phase 1's coexist", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    const tableNames = tables.rows.map((row) => row.table_name);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "user",
        "session",
        "account",
        "verification",
        "stock",
        "camera",
        "lens",
        "bag_item",
        "lab",
        "lab_branch",
        "roll",
      ]),
    );
  });

  // Perf fix (test stability): the PGlite instance is now reused across
  // calls within a worker (migrated once, not once per test) — this pins
  // down that reuse doesn't leak rows from one test into the next.
  it("does not leak rows from one createTestDb() call into the next", async () => {
    const first = await createTestDb();
    cleanup = () => first.client.close();
    await first.db.execute(sql`INSERT INTO stock (brand, name) VALUES ('Kodak', 'Gold 200')`);
    const seeded = await first.db.execute(sql`SELECT id FROM stock`);
    expect(seeded.rows).toHaveLength(1);

    await cleanup();
    cleanup = undefined;

    const second = await createTestDb();
    cleanup = () => second.client.close();
    const rows = await second.db.execute(sql`SELECT id FROM stock`);
    expect(rows.rows).toHaveLength(0);
  });
});
