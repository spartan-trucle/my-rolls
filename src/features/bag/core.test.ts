import { afterEach, describe, expect, it } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { bagItem, camera, lens, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { addToBagCore, removeFromBagCore } from "./core";

const OWNER = "user-1";
const OTHER_USER = "user-2";

describe("addToBagCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("adds a seeded stock to the caller's bag", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();

    const result = await addToBagCore(db, OWNER, { kind: "stock", refId: stockRow.id });

    expect(result.ok).toBe(true);
    const rows = await db.select().from(bagItem);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: OWNER, kind: "stock", refId: stockRow.id });
  });

  it("rejects a ref that doesn't exist", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addToBagCore(db, OWNER, {
      kind: "stock",
      refId: "00000000-0000-0000-0000-000000000000",
    });

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects another user's private stock — the ref must be seeded or the caller's own", async () => {
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

    const result = await addToBagCore(db, OWNER, { kind: "stock", refId: otherStock.id });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(await db.select().from(bagItem)).toHaveLength(0);
  });

  it("rejects another user's lens — lenses are never seeded (D3)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [otherLens] = await db
      .insert(lens)
      .values({ ownerId: OTHER_USER, brand: "Helios", model: "44-2" })
      .returning();

    const result = await addToBagCore(db, OWNER, { kind: "lens", refId: otherLens.id });

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects a duplicate — no second live bag item for the same kind + ref", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Pentax", model: "K1000", searchText: toSearchText("Pentax K1000") })
      .returning();

    const first = await addToBagCore(db, OWNER, { kind: "camera", refId: cameraRow.id });
    expect(first.ok).toBe(true);

    const second = await addToBagCore(db, OWNER, { kind: "camera", refId: cameraRow.id });
    expect(second).toEqual({ ok: false, error: "duplicate" });

    expect(await db.select().from(bagItem)).toHaveLength(1);
  });

  it("allows re-adding after the earlier bag item was removed (soft-deleted)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [cameraRow] = await db
      .insert(camera)
      .values({ brand: "Pentax", model: "K1000", searchText: toSearchText("Pentax K1000") })
      .returning();

    const first = await addToBagCore(db, OWNER, { kind: "camera", refId: cameraRow.id });
    if (!first.ok) throw new Error("expected first add to succeed");
    await removeFromBagCore(db, OWNER, { bagItemId: first.bagItemId });

    const second = await addToBagCore(db, OWNER, { kind: "camera", refId: cameraRow.id });
    expect(second.ok).toBe(true);
  });
});

describe("removeFromBagCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("soft-deletes the caller's own bag item", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [item] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "stock", refId: stockRow.id })
      .returning();

    const result = await removeFromBagCore(db, OWNER, { bagItemId: item.id });

    expect(result).toEqual({ ok: true });

    const rows = await db.select().from(bagItem).where(eq(bagItem.id, item.id));
    expect(rows[0]?.deletedAt).not.toBeNull();

    const liveRows = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.id, item.id), isNull(bagItem.deletedAt)));
    expect(liveRows).toHaveLength(0);
  });

  it("never removes another user's bag item", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [item] = await db
      .insert(bagItem)
      .values({ userId: OTHER_USER, kind: "stock", refId: stockRow.id })
      .returning();

    const result = await removeFromBagCore(db, OWNER, { bagItemId: item.id });

    expect(result).toEqual({ ok: false, error: "not_found" });

    const rows = await db.select().from(bagItem).where(eq(bagItem.id, item.id));
    expect(rows[0]?.deletedAt).toBeNull();
  });

  it("returns not_found for an already-removed bag item", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "Portra 400", searchText: toSearchText("Kodak Portra 400") })
      .returning();
    const [item] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "stock", refId: stockRow.id })
      .returning();

    await removeFromBagCore(db, OWNER, { bagItemId: item.id });
    const second = await removeFromBagCore(db, OWNER, { bagItemId: item.id });

    expect(second).toEqual({ ok: false, error: "not_found" });
  });
});
