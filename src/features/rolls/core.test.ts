import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { bagItem, camera, lens, roll, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { createRollCore, getRollCore, listRollsCore } from "./core";

const OWNER = "user-1";
const OTHER_USER = "user-2";

// A fixed "now" so the future-date tests (D14) are deterministic instead
// of depending on when the suite happens to run. 12:00 UTC, 15 Jun 2026 —
// well clear of any Vietnam-time day boundary in the surrounding tests.
const NOW = Date.parse("2026-06-15T12:00:00Z");

function vnMidnight(dateIso: string): number {
  // `dateIso` is a `YYYY-MM-DD` calendar day in Asia/Ho_Chi_Minh (UTC+7,
  // no DST) — midnight there is 17:00 the previous UTC day.
  return Date.parse(`${dateIso}T00:00:00+07:00`);
}

async function seedBasics(db: Awaited<ReturnType<typeof createTestDb>>["db"]) {
  const [stockRow] = await db
    .insert(stock)
    .values({
      brand: "Kodak",
      name: "Portra 400",
      iso: 400,
      canisterColor: "gold",
      searchText: toSearchText("Kodak Portra 400"),
    })
    .returning();

  const [cameraRow] = await db
    .insert(camera)
    .values({ brand: "Canon", model: "AE-1", searchText: toSearchText("Canon AE-1") })
    .returning();

  const [cameraBagItemRow] = await db
    .insert(bagItem)
    .values({ userId: OWNER, kind: "camera", refId: cameraRow.id })
    .returning();

  return { stockRow, cameraRow, cameraBagItemRow };
}

describe("createRollCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("creates a new-mode roll, defaulting boxIso/canisterColor from the stock and shotFrom to now", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow).toMatchObject({
      userId: OWNER,
      stockId: stockRow.id,
      cameraBagItemId: cameraBagItemRow.id,
      boxIso: 400,
      canisterColor: "gold",
      version: 1,
    });
    expect(rollRow.shotFrom?.getTime()).toBe(NOW);
  });

  it("adds the stock to the bag in the same transaction when it isn't there yet", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    const stockBagItems = await db
      .select()
      .from(bagItem)
      .where(eq(bagItem.refId, stockRow.id));
    expect(stockBagItems).toHaveLength(1);
    expect(stockBagItems[0]).toMatchObject({ userId: OWNER, kind: "stock" });
  });

  it("does not duplicate the bag item when the stock is already in the bag", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id });

    await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    const stockBagItems = await db.select().from(bagItem).where(eq(bagItem.refId, stockRow.id));
    expect(stockBagItems).toHaveLength(1);
  });

  it("accepts an optional lens the caller owns", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const [lensRow] = await db
      .insert(lens)
      .values({ ownerId: OWNER, brand: "Helios", model: "44-2" })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id, lensId: lensRow.id },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.lensId).toBe(lensRow.id);
  });

  it("rejects a lens owned by another user (owner isolation)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const [otherLensRow] = await db
      .insert(lens)
      .values({ ownerId: OTHER_USER, brand: "Helios", model: "44-2" })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "new",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        lensId: otherLensRow.id,
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects a stock that doesn't exist or belongs to another user (owner isolation)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { cameraBagItemRow } = await seedBasics(db);
    const [otherStockRow] = await db
      .insert(stock)
      .values({ ownerId: OTHER_USER, brand: "Fuji", name: "Pro 400H", searchText: toSearchText("Fuji Pro 400H") })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: otherStockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects a camera bag item that belongs to another user (owner isolation)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraRow } = await seedBasics(db);
    const [otherCameraBagItemRow] = await db
      .insert(bagItem)
      .values({ userId: OTHER_USER, kind: "camera", refId: cameraRow.id })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: otherCameraBagItemRow.id },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("rejects a camera bag item that isn't of kind camera", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow } = await seedBasics(db);
    const [stockBagItemRow] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "stock", refId: stockRow.id })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: stockBagItemRow.id },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("forces the roll's stock to a single-use camera's fixed film (D20)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const [fixedStockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "FunSaver film", searchText: toSearchText("Kodak FunSaver film") })
      .returning();
    const [singleUseCameraRow] = await db
      .insert(camera)
      .values({
        brand: "Kodak",
        model: "FunSaver",
        fixedStockId: fixedStockRow.id,
        searchText: toSearchText("Kodak FunSaver"),
      })
      .returning();
    const [cameraBagItemRow] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "camera", refId: singleUseCameraRow.id })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: fixedStockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.stockId).toBe(fixedStockRow.id);
  });

  it("rejects a stockId that doesn't match a single-use camera's fixed film (D20)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow: otherStockRow } = await seedBasics(db);
    const [fixedStockRow] = await db
      .insert(stock)
      .values({ brand: "Kodak", name: "FunSaver film", searchText: toSearchText("Kodak FunSaver film") })
      .returning();
    const [singleUseCameraRow] = await db
      .insert(camera)
      .values({
        brand: "Kodak",
        model: "FunSaver",
        fixedStockId: fixedStockRow.id,
        searchText: toSearchText("Kodak FunSaver"),
      })
      .returning();
    const [cameraBagItemRow] = await db
      .insert(bagItem)
      .values({ userId: OWNER, kind: "camera", refId: singleUseCameraRow.id })
      .returning();

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: otherStockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "fixed_stock_mismatch" });
  });

  it("accepts past-mode dates strictly before today in Vietnam time", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "past",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFrom: vnMidnight("2026-06-10"),
        shotTo: vnMidnight("2026-06-12"),
      },
      NOW,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects past-mode dates on the same Vietnam calendar day as now (still valid: not future)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    // NOW is 2026-06-15T12:00:00Z = 2026-06-15T19:00 in Vietnam. Midnight
    // that same Vietnam day is earlier than NOW, so it's today, not the
    // future — this must be accepted.
    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "past",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFrom: vnMidnight("2026-06-15"),
        shotTo: vnMidnight("2026-06-15"),
      },
      NOW,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a shotTo that falls on the next Vietnam calendar day after now (the future rule around midnight)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "past",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFrom: vnMidnight("2026-06-15"),
        shotTo: vnMidnight("2026-06-16"),
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "validation" });
  });

  it("rejects shotFrom after shotTo", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "past",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFrom: vnMidnight("2026-06-12"),
        shotTo: vnMidnight("2026-06-10"),
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "validation" });
  });

  it("rolls back the bag-item insert when the roll insert fails — no orphan bag item", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const originalTransaction = client.transaction.bind(client);
    const transactionSpy = vi
      .spyOn(client, "transaction")
      .mockImplementation(async (callback: Parameters<typeof client.transaction>[0]) => {
        return originalTransaction(async (txClient) => {
          const originalQuery = txClient.query.bind(txClient);
          txClient.query = (async (...args: Parameters<typeof originalQuery>) => {
            const sqlText = String(args[0] ?? "");
            if (/insert into "?roll"?/i.test(sqlText)) {
              throw new Error("boom: simulated roll insert failure");
            }
            return originalQuery(...args);
          }) as typeof txClient.query;

          return callback(txClient);
        });
      });

    await expect(
      createRollCore(
        db,
        OWNER,
        { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
        NOW,
      ),
    ).rejects.toThrow(/roll/);

    transactionSpy.mockRestore();

    expect(await db.select().from(roll)).toHaveLength(0);
    expect(await db.select().from(bagItem).where(eq(bagItem.refId, stockRow.id))).toHaveLength(0);
  });
});

describe("listRollsCore and getRollCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("lists only the caller's own live rolls, newest first, joined to stock/camera/lens with a pushPull badge", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const [lensRow] = await db
      .insert(lens)
      .values({ ownerId: OWNER, brand: "Helios", model: "44-2" })
      .returning();

    const first = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id, shotIso: 800, lensId: lensRow.id },
      NOW,
    );
    const second = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW + 1000,
    );

    // Another user's roll must never show up.
    const [otherCameraBagItemRow] = await db
      .insert(bagItem)
      .values({ userId: OTHER_USER, kind: "camera", refId: cameraBagItemRow.refId })
      .returning();
    await createRollCore(
      db,
      OTHER_USER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: otherCameraBagItemRow.id },
      NOW,
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const entries = await listRollsCore(db, OWNER);

    expect(entries.map((entry) => entry.id)).toEqual([second.rollId, first.rollId]);

    const firstEntry = entries.find((entry) => entry.id === first.rollId);
    expect(firstEntry?.stock).toMatchObject({ brand: "Kodak", name: "Portra 400", iso: 400 });
    expect(firstEntry?.camera).toMatchObject({ brand: "Canon", model: "AE-1" });
    expect(firstEntry?.lens).toMatchObject({ brand: "Helios", model: "44-2" });
    // boxIso 400, shotIso 800 -> +1 stop.
    expect(firstEntry?.pushPull).toBe("+1");

    const secondEntry = entries.find((entry) => entry.id === second.rollId);
    expect(secondEntry?.pushPull).toBeNull();
  });

  it("excludes soft-deleted rolls", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await db.update(roll).set({ deletedAt: new Date() }).where(eq(roll.id, created.rollId));

    expect(await listRollsCore(db, OWNER)).toHaveLength(0);
    expect(await getRollCore(db, OWNER, created.rollId)).toBeNull();
  });

  it("getRollCore returns null for a roll owned by another user (owner isolation)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await getRollCore(db, OTHER_USER, created.rollId)).toBeNull();
  });

  it("getRollCore returns the single roll's full entry for its owner", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id, shotIso: 400 },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const entry = await getRollCore(db, OWNER, created.rollId);
    expect(entry?.id).toBe(created.rollId);
    expect(entry?.pushPull).toBe("0");
  });
});
