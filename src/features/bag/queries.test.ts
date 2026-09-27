import { afterEach, describe, expect, it } from "vitest";
import { bagItem, camera, lens, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { listBag } from "./queries";

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
});
