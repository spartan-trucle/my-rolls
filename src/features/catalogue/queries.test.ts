import { afterEach, describe, expect, it } from "vitest";
import { camera, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { POPULAR_CAMERA_SLUGS, POPULAR_STOCK_SLUGS } from "@/features/catalogue/popularSlugs";
import { toSearchText } from "@/lib/search-text";
import { getCatalogueBySlugs, listCatalogue, searchCatalogue, type TStockEntry } from "./queries";

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

describe("listCatalogue", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("puts the caller's own entries first, before any seeded row", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values([
      { brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") },
      {
        ownerId: OWNER,
        brand: "Zzz",
        name: "My respool",
        searchText: toSearchText("Zzz My respool"),
      },
    ]);

    const results = (await listCatalogue(db, { kind: "stock", userId: OWNER })) as TStockEntry[];

    expect(results[0]?.name).toBe("My respool");
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

    const results = await listCatalogue(db, { kind: "stock", userId: OWNER });

    expect(results).toHaveLength(0);
  });

  it("orders the popular slugs (popularSlugs.ts) ahead of the rest of the catalogue", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const popularSlug = POPULAR_STOCK_SLUGS[0];
    await db.insert(stock).values([
      { slug: "aaa-not-popular", brand: "Aaa", name: "Not popular", searchText: toSearchText("Aaa Not popular") },
      { slug: popularSlug, brand: "Zzz", name: "Popular one", searchText: toSearchText("Zzz Popular one") },
    ]);

    const results = (await listCatalogue(db, { kind: "stock", userId: OWNER })) as TStockEntry[];

    expect(results.map((r) => r.name)).toEqual(["Popular one", "Not popular"]);
  });

  it("orders popular cameras ahead of the rest, then the rest by brand/model", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const popularSlug = POPULAR_CAMERA_SLUGS[0];
    await db.insert(camera).values([
      { slug: "aaa-not-popular", brand: "Aaa", model: "Not popular", searchText: toSearchText("Aaa Not popular") },
      { slug: popularSlug, brand: "Zzz", model: "Popular one", searchText: toSearchText("Zzz Popular one") },
    ]);

    const results = await listCatalogue(db, { kind: "camera", userId: OWNER });

    expect(results.map((r) => r.kind === "camera" && r.model)).toEqual(["Popular one", "Not popular"]);
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

    const results = await listCatalogue(db, { kind: "stock", userId: OWNER });

    expect(results).toHaveLength(0);
  });

  it("caps the result at `limit`", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values(
      Array.from({ length: 5 }, (_, index) => ({
        brand: "Kodak",
        name: `Stock ${index}`,
        searchText: toSearchText(`Kodak Stock ${index}`),
      })),
    );

    const results = await listCatalogue(db, { kind: "stock", userId: OWNER, limit: 3 });

    expect(results).toHaveLength(3);
  });
});

describe("getCatalogueBySlugs", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("returns seeded stocks matching the given slugs, in slug order", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values([
      { slug: "kodak-portra-400-400", brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") },
      { slug: "kodak-gold-200-200", brand: "Kodak", name: "Gold 200", searchText: toSearchText("Kodak Gold 200") },
    ]);

    const results = await getCatalogueBySlugs(db, {
      kind: "stock",
      slugs: ["kodak-gold-200-200", "kodak-portra-400-400"],
    });

    expect(results.map((entry) => entry.kind === "stock" && entry.name)).toEqual(["Gold 200", "Portra 400"]);
  });

  it("returns seeded cameras matching the given slugs", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(camera).values({ slug: "pentax-k1000", brand: "Pentax", model: "K1000", searchText: toSearchText("Pentax K1000") });

    const results = await getCatalogueBySlugs(db, { kind: "camera", slugs: ["pentax-k1000"] });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ kind: "camera", model: "K1000" });
  });

  it("drops a slug the catalogue doesn't have, rather than a gap", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const results = await getCatalogueBySlugs(db, { kind: "stock", slugs: ["not-a-real-slug"] });

    expect(results).toEqual([]);
  });

  it("never returns a user's private entry, even if its slug matches", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values({
      ownerId: OWNER,
      slug: "kodak-portra-400-400",
      brand: "Kodak",
      name: "Portra 400 (private)",
      searchText: toSearchText("Kodak Portra 400 private"),
    });

    const results = await getCatalogueBySlugs(db, { kind: "stock", slugs: ["kodak-portra-400-400"] });

    expect(results).toEqual([]);
  });

  it("excludes a soft-deleted seeded row", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(stock).values({
      slug: "kodak-portra-400-400",
      brand: "Kodak",
      name: "Portra 400",
      searchText: toSearchText("Kodak Portra 400"),
      deletedAt: new Date(),
    });

    const results = await getCatalogueBySlugs(db, { kind: "stock", slugs: ["kodak-portra-400-400"] });

    expect(results).toEqual([]);
  });

  it("returns nothing for an empty slugs array", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    expect(await getCatalogueBySlugs(db, { kind: "stock", slugs: [] })).toEqual([]);
  });
});
