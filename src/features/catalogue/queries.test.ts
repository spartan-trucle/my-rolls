import { afterEach, describe, expect, it } from "vitest";
import { camera, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { searchCatalogue, type TStockEntry } from "./queries";

const OWNER = "user-1";
const OTHER_USER = "user-2";

describe("searchCatalogue", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("finds a stock by accent-free query (D8): 'portra' finds 'Portra 400'", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") });

    const results = await searchCatalogue(db, { kind: "stock", q: "portra", userId: OWNER });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: "stock", name: "Portra 400" });
  });

  it("'fm2' finds 'Nikon FM2' via the ILIKE fallback", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db
      .insert(camera)
      .values({ brand: "Nikon", model: "FM2", searchText: toSearchText("Nikon FM2") });

    const results = await searchCatalogue(db, { kind: "camera", q: "fm2", userId: OWNER });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: "camera", model: "FM2" });
  });

  it("'fm 2' (a space the stored search_text doesn't have) still finds 'Nikon FM2' via trigram similarity", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db
      .insert(camera)
      .values({ brand: "Nikon", model: "FM2", searchText: toSearchText("Nikon FM2") });

    const results = await searchCatalogue(db, { kind: "camera", q: "fm 2", userId: OWNER });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: "camera", model: "FM2" });
  });

  it("never returns another user's private entry", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values({
      ownerId: OTHER_USER,
      brand: "Kodak",
      name: "Portra 400 (respool)",
      searchText: toSearchText("Kodak Portra 400 (respool)"),
    });

    const results = await searchCatalogue(db, { kind: "stock", q: "portra", userId: OWNER });

    expect(results).toHaveLength(0);
  });

  it("returns the caller's own private entry alongside seeded rows", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values([
      { brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") },
      {
        ownerId: OWNER,
        brand: "Kodak",
        name: "Portra 400 (my respool)",
        searchText: toSearchText("Kodak Portra 400 (my respool)"),
      },
    ]);

    const results = (await searchCatalogue(db, {
      kind: "stock",
      q: "portra",
      userId: OWNER,
    })) as TStockEntry[];

    expect(results.map((r) => r.name).sort()).toEqual(
      ["Portra 400", "Portra 400 (my respool)"].sort(),
    );
  });

  it("hides soft-deleted rows", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values({
      brand: "Kodak",
      name: "Portra 400",
      searchText: toSearchText("Kodak Portra 400"),
      deletedAt: new Date(),
    });

    const results = await searchCatalogue(db, { kind: "stock", q: "portra", userId: OWNER });

    expect(results).toHaveLength(0);
  });

  it("returns nothing for an empty query (the picker shows the bag first)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") });

    expect(await searchCatalogue(db, { kind: "stock", q: "", userId: OWNER })).toEqual([]);
    expect(await searchCatalogue(db, { kind: "stock", q: "   ", userId: OWNER })).toEqual([]);
  });

  it("ranks a closer similarity match first", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values([
      { brand: "Ilford", name: "HP5 Plus", searchText: toSearchText("Ilford HP5 Plus") },
      { brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") },
    ]);

    const results = (await searchCatalogue(db, {
      kind: "stock",
      q: "portra 400",
      userId: OWNER,
    })) as TStockEntry[];

    expect(results[0]?.name).toBe("Portra 400");
  });
});
