import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { camera, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { seedCatalogue, type TCameraSeed, type TStockSeed } from "./seed-catalogue";

const FIXTURE_STOCKS: TStockSeed[] = [
  {
    slug: "kodak-800-funsaver-film-800",
    brand: "Kodak",
    name: "800 (FunSaver film)",
    iso: 800,
    formats: ["35mm"],
    type: "color-negative",
    canisterColor: "gold",
    status: "current",
  },
  {
    slug: "ilford-hp5-plus-400",
    brand: "Ilford",
    name: "HP5 Plus",
    iso: 400,
    formats: ["35mm", "120"],
    type: "bw",
    canisterColor: "mono",
    status: "current",
  },
];

const FIXTURE_CAMERAS: TCameraSeed[] = [
  { slug: "pentax-k1000", brand: "Pentax", model: "K1000", type: "slr", format: "35mm" },
  {
    slug: "kodak-funsaver",
    brand: "Kodak",
    model: "FunSaver",
    type: "single-use",
    format: "35mm",
    fixedStockSlug: "kodak-800-funsaver-film-800",
  },
];

describe("seedCatalogue", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("inserts every stock and camera, filling search_text and resolving fixed_stock_id (D20)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await seedCatalogue(db, FIXTURE_STOCKS, FIXTURE_CAMERAS);

    const stocks = await db.select().from(stock);
    const cameras = await db.select().from(camera);

    expect(stocks).toHaveLength(2);
    expect(stocks.find((s) => s.slug === "ilford-hp5-plus-400")?.searchText).toBe(
      "ilford hp5 plus",
    );

    expect(cameras).toHaveLength(2);
    const funSaver = cameras.find((c) => c.slug === "kodak-funsaver");
    const fixedStock = stocks.find((s) => s.slug === "kodak-800-funsaver-film-800");
    expect(funSaver?.fixedStockId).toBe(fixedStock?.id);
    expect(cameras.find((c) => c.slug === "pentax-k1000")?.fixedStockId).toBeNull();
  });

  it("a second run changes nothing — same row count, same ids, same search_text", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await seedCatalogue(db, FIXTURE_STOCKS, FIXTURE_CAMERAS);
    const stocksBefore = await db.select().from(stock).orderBy(stock.slug);
    const camerasBefore = await db.select().from(camera).orderBy(camera.slug);

    await seedCatalogue(db, FIXTURE_STOCKS, FIXTURE_CAMERAS);
    const stocksAfter = await db.select().from(stock).orderBy(stock.slug);
    const camerasAfter = await db.select().from(camera).orderBy(camera.slug);

    expect(stocksAfter).toHaveLength(stocksBefore.length);
    expect(camerasAfter).toHaveLength(camerasBefore.length);
    expect(stocksAfter.map((s) => s.id)).toEqual(stocksBefore.map((s) => s.id));
    expect(camerasAfter.map((c) => c.id)).toEqual(camerasBefore.map((c) => c.id));
    expect(stocksAfter).toEqual(stocksBefore);
    expect(camerasAfter).toEqual(camerasBefore);
    // updated_at specifically, not only folded into the deep-equal checks
    // above: a real no-op must not touch it either.
    expect(stocksAfter.map((s) => s.updatedAt)).toEqual(stocksBefore.map((s) => s.updatedAt));
    expect(camerasAfter.map((c) => c.updatedAt)).toEqual(
      camerasBefore.map((c) => c.updatedAt),
    );
  });

  it("bumps updated_at only on the row whose data actually changed", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await seedCatalogue(db, FIXTURE_STOCKS, []);
    const before = await db.select().from(stock).orderBy(stock.slug);

    const changedStocks: TStockSeed[] = FIXTURE_STOCKS.map((row) =>
      row.slug === "ilford-hp5-plus-400" ? { ...row, iso: 401 } : row,
    );
    await seedCatalogue(db, changedStocks, []);
    const after = await db.select().from(stock).orderBy(stock.slug);

    const beforeBySlug = new Map(before.map((row) => [row.slug, row]));
    for (const row of after) {
      const previous = beforeBySlug.get(row.slug);
      if (row.slug === "ilford-hp5-plus-400") {
        expect(row.iso).toBe(401);
        expect(row.updatedAt).not.toEqual(previous?.updatedAt);
      } else {
        expect(row.updatedAt).toEqual(previous?.updatedAt);
      }
    }
  });

  it("never touches a user's private custom stock with the same slug (owner scoping)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.execute(
      sql`INSERT INTO stock (owner_id, slug, brand, name) VALUES ('user-1', 'kodak-800-funsaver-film-800', 'Kodak', 'My custom copy')`,
    );

    await seedCatalogue(db, FIXTURE_STOCKS, []);

    const stocks = await db.select().from(stock);
    // The private row plus both seeded rows (FIXTURE_STOCKS) — the seed
    // never matches, updates or removes the user's private stock, even
    // though its slug collides with a seeded one.
    expect(stocks).toHaveLength(3);
    expect(stocks.find((s) => s.ownerId === "user-1")?.name).toBe("My custom copy");
    expect(
      stocks.find((s) => s.ownerId === null && s.slug === "kodak-800-funsaver-film-800")
        ?.name,
    ).toBe("800 (FunSaver film)");
  });

  it("fails the whole seed when a camera names a fixedStockSlug that doesn't exist, and rolls back", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const badCameras: TCameraSeed[] = [
      {
        slug: "made-up-single-use",
        brand: "Nobody",
        model: "Made Up",
        type: "single-use",
        format: "35mm",
        fixedStockSlug: "no-such-stock-slug",
      },
    ];

    await expect(seedCatalogue(db, FIXTURE_STOCKS, badCameras)).rejects.toThrow(
      /no-such-stock-slug/,
    );

    // Rolled back: nothing from this run should have committed, including
    // the stocks that would otherwise have succeeded on their own.
    const stocks = await db.select().from(stock);
    const cameras = await db.select().from(camera);
    expect(stocks).toHaveLength(0);
    expect(cameras).toHaveLength(0);
  });

  it("seeds the real data/catalogue files without error, and every single-use camera resolves its fixed film", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const stocksPath = path.join(process.cwd(), "data/catalogue/stocks.json");
    const camerasPath = path.join(process.cwd(), "data/catalogue/cameras.json");
    const realStocks: TStockSeed[] = JSON.parse(readFileSync(stocksPath, "utf8"));
    const realCameras: TCameraSeed[] = JSON.parse(readFileSync(camerasPath, "utf8"));

    await seedCatalogue(db, realStocks, realCameras);

    const stocks = await db.select().from(stock);
    const cameras = await db.select().from(camera);
    expect(stocks.length).toBe(realStocks.length);
    expect(cameras.length).toBe(realCameras.length);

    const singleUseCameras = cameras.filter((c) => c.fixedStockId !== null);
    expect(singleUseCameras.length).toBe(
      realCameras.filter((c) => c.fixedStockSlug).length,
    );
    for (const singleUse of singleUseCameras) {
      expect(stocks.some((s) => s.id === singleUse.fixedStockId)).toBe(true);
    }
  });
});
