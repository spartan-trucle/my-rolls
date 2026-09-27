import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { bagItem, camera, lens, roll, stock, user } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { getProfileSummary, listBag, summarizeBag } from "./queries";

const OWNER = "user-1";
const OTHER_USER = "user-2";

describe("listBag", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("returns the owner's stock, camera and lens bag items, newest first (BAG-1)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Pentax", model: "K1000", searchText: toSearchText("Pentax K1000") })
      .returning();
    const [lensRow] = await db
      .insert(lens)
      .values({ ownerId: OWNER, brand: "Helios", model: "44-2" })
      .returning();

    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await db.insert(bagItem).values({ userId: OWNER, kind: "camera", refId: cameraRow.id });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await db.insert(bagItem).values({ userId: OWNER, kind: "lens", refId: lensRow.id });

    const entries = await listBag(db, OWNER);

    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.kind)).toEqual(["lens", "camera", "stock"]);
    expect(entries[0]).toMatchObject({ kind: "lens", lens: { id: lensRow.id } });
    expect(entries[1]).toMatchObject({ kind: "camera", camera: { id: cameraRow.id } });
    expect(entries[2]).toMatchObject({ kind: "stock", stock: { id: stockRow.id } });
  });

  it("never returns another user's bag items or private entries", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [otherStock] = await db
      .insert(stock)
      .values({
        ownerId: OTHER_USER,
        brand: "Kodak",
        name: "Ektar 100",
        searchText: toSearchText("Kodak Ektar 100"),
      })
      .returning();

    await db.insert(bagItem).values({ userId: OTHER_USER, kind: "stock", refId: otherStock.id });

    expect(await listBag(db, OWNER)).toEqual([]);
  });

  it("hides a soft-deleted bag item", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();

    await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "stock", refId: stockRow.id, deletedAt: new Date() });

    expect(await listBag(db, OWNER)).toEqual([]);
  });

  it("carries a single-use camera's fixed stock (D20)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [fixedStock] = await db
      .insert(stock)
      .values({
        brand: "Kodak",
        name: "800 (FunSaver film)",
        iso: 800,
        searchText: toSearchText("Kodak 800 (FunSaver film)"),
      })
      .returning();

    const [funSaver] = await db
      .insert(camera)
      .values({
        brand: "Kodak",
        model: "FunSaver",
        type: "single-use",
        fixedStockId: fixedStock.id,
        searchText: toSearchText("Kodak FunSaver"),
      })
      .returning();

    await db.insert(bagItem).values({ userId: OWNER, kind: "camera", refId: funSaver.id });

    const entries = await listBag(db, OWNER);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: "camera",
      camera: { id: funSaver.id },
      fixedStock: { id: fixedStock.id, name: "800 (FunSaver film)" },
    });
  });

  it("leaves fixedStock null for a camera with no fixed film", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Pentax", model: "K1000", searchText: toSearchText("Pentax K1000") })
      .returning();

    await db.insert(bagItem).values({ userId: OWNER, kind: "camera", refId: cameraRow.id });

    const entries = await listBag(db, OWNER);

    expect(entries[0]).toMatchObject({ kind: "camera", fixedStock: null });
  });

  it("carries qty/expiryYear on a stock entry, null when not set (BAG-2, Round 2)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();

    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id, qty: 3, expiryYear: 2027 });

    const entries = await listBag(db, OWNER);

    expect(entries[0]).toMatchObject({ kind: "stock", qty: 3, expiryYear: 2027 });
  });

  it("counts rollsShot per camera, stock and lens bag item, owner-scoped (BAG-3, Round 2)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Canon", model: "AE-1", searchText: toSearchText("Canon AE-1") })
      .returning();
    const [lensRow] = await db
      .insert(lens)
      .values({ ownerId: OWNER, brand: "Helios", model: "44-2" })
      .returning();
    const [cameraBagItem] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "camera", refId: cameraRow.id })
      .returning();
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id });
    await db.insert(bagItem).values({ userId: OWNER, kind: "lens", refId: lensRow.id });

    await db.insert(roll).values({
      userId: OWNER,
      stockId: stockRow.id,
      cameraBagItemId: cameraBagItem.id,
      lensId: lensRow.id,
    });
    await db.insert(roll).values({ userId: OWNER, stockId: stockRow.id, cameraBagItemId: cameraBagItem.id });
    // Another user's roll on the same catalogue rows must never count here.
    const [otherCameraBagItem] = await db
      .insert(bagItem)
      .values({ userId: OTHER_USER, kind: "camera", refId: cameraRow.id })
      .returning();
    await db.insert(roll).values({ userId: OTHER_USER, stockId: stockRow.id, cameraBagItemId: otherCameraBagItem.id });

    const entries = await listBag(db, OWNER);

    expect(entries.find((entry) => entry.kind === "camera")).toMatchObject({ rollsShot: 2 });
    expect(entries.find((entry) => entry.kind === "stock")).toMatchObject({ rollsShot: 2 });
    expect(entries.find((entry) => entry.kind === "lens")).toMatchObject({ rollsShot: 1 });
  });
});

describe("summarizeBag", () => {
  it("sums qty for unloadedRolls, counts entries by kind, and lists canisters with qty > 0", async () => {
    const { db, client } = await createTestDb();
    const cleanup = () => client.close();

    const [gold] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Gold 200", canisterColor: "gold", iso: 200, searchText: "kodak gold 200" })
      .returning();
    const [hp5] = await db
      .insert(stock)
      .values({ brand: "Ilford", name: "HP5+", canisterColor: "mono", iso: 400, searchText: "ilford hp5" })
      .returning();
    const [tmax] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "T-Max 100", canisterColor: "mono", iso: 100, searchText: "kodak tmax 100" })
      .returning();
    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Pentax", model: "K1000", searchText: "pentax k1000" })
      .returning();

    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: gold.id, qty: 3 });
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: hp5.id, qty: 0 });
    // Not counted at all — excluded from unloadedRolls and the strip, still counted in filmTypeCount.
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: tmax.id });
    await db.insert(bagItem).values({ userId: OWNER, kind: "camera", refId: cameraRow.id });

    const entries = await listBag(db, OWNER);
    const summary = summarizeBag(entries);
    await cleanup();

    expect(summary.unloadedRolls).toBe(3);
    expect(summary.filmTypeCount).toBe(3);
    expect(summary.cameraCount).toBe(1);
    expect(summary.lensCount).toBe(0);
    expect(summary.canisters).toEqual([{ stockId: gold.id, canisterColor: "gold", iso: 200, qty: 3 }]);
  });

  it("is empty for an empty bag", () => {
    expect(summarizeBag([])).toEqual({
      unloadedRolls: 0,
      filmTypeCount: 0,
      cameraCount: 0,
      lensCount: 0,
      canisters: [],
    });
  });
});

describe("getProfileSummary", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("returns the roll count, a bag preview (cameras with rollsShot, stocks) and the join date (PR1/PR4, Round 2)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const joinedAt = new Date("2026-01-15T00:00:00Z");
    await db.insert(user).values({ id: OWNER, name: "Trúc", email: "truc@example.com", createdAt: joinedAt });

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Canon", model: "AE-1", searchText: toSearchText("Canon AE-1") })
      .returning();
    const [cameraBagItem] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "camera", refId: cameraRow.id })
      .returning();
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id });

    await db.insert(roll).values({ userId: OWNER, stockId: stockRow.id, cameraBagItemId: cameraBagItem.id });
    await db.insert(roll).values({ userId: OWNER, stockId: stockRow.id, cameraBagItemId: cameraBagItem.id });

    const summary = await getProfileSummary(db, OWNER);

    expect(summary.rollCount).toBe(2);
    expect(summary.cameras).toEqual([
      { bagItemId: cameraBagItem.id, brand: "Canon", model: "AE-1", rollsShot: 2 },
    ]);
    expect(summary.stocks).toEqual([{ stockId: stockRow.id, brand: "Kodak", name: "Portra 400", canisterColor: null }]);
    expect(summary.joinedAt?.toISOString()).toBe(joinedAt.toISOString());
  });

  it("excludes soft-deleted rolls from rollCount", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await db.insert(user).values({ id: OWNER, name: "Trúc", email: "truc2@example.com" });
    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Canon", model: "AE-1", searchText: toSearchText("Canon AE-1") })
      .returning();
    const [cameraBagItem] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "camera", refId: cameraRow.id })
      .returning();

    const [deletedRoll] = await db
      .insert(roll)
      .values({ userId: OWNER, stockId: stockRow.id, cameraBagItemId: cameraBagItem.id })
      .returning();
    await db.update(roll).set({ deletedAt: new Date() }).where(eq(roll.id, deletedRoll.id));

    const summary = await getProfileSummary(db, OWNER);

    expect(summary.rollCount).toBe(0);
  });
});
