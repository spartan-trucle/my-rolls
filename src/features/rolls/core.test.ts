import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { bagItem, camera, lens, roll, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { createRollCore, getRollCore, listRollsCore, peekNextRollNumberCore, updateRollCore } from "./core";

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
      .values({ brand: "Kodak", name: "FunSaver film", iso: 800, searchText: toSearchText("Kodak FunSaver film") })
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
      .values({ brand: "Kodak", name: "FunSaver film", iso: 800, searchText: toSearchText("Kodak FunSaver film") })
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

describe("createRollCore — roll numbers (R2-5)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("assigns 1 to a user's first roll, day precision by default", async () => {
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
    expect(result.number).toBe(1);
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.number).toBe(1);
    expect(rollRow.datePrecision).toBe("day");
  });

  it("increments per user, in creation order", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const first = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    const second = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW + 1000,
    );

    expect(first.ok && first.number).toBe(1);
    expect(second.ok && second.number).toBe(2);
  });

  it("never reuses a number after its roll is soft-deleted", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const first = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    if (!first.ok) throw new Error("expected first create to succeed");
    await db.update(roll).set({ deletedAt: new Date() }).where(eq(roll.id, first.rollId));

    const second = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW + 1000,
    );

    expect(second.ok && second.number).toBe(2);
  });

  it("numbers each user independently", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraRow, cameraBagItemRow } = await seedBasics(db);
    const [otherCameraBagItem] = await db
      .insert(bagItem)
      .values({ userId: OTHER_USER, kind: "camera", refId: cameraRow.id })
      .returning();

    const ownerRoll = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    const otherRoll = await createRollCore(
      db,
      OTHER_USER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: otherCameraBagItem.id },
      NOW,
    );

    expect(ownerRoll.ok && ownerRoll.number).toBe(1);
    expect(otherRoll.ok && otherRoll.number).toBe(1);
  });

  it("retries once on a simulated unique violation on the roll number", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const originalTransaction = client.transaction.bind(client);
    let insertAttempts = 0;
    const transactionSpy = vi
      .spyOn(client, "transaction")
      .mockImplementation(async (callback: Parameters<typeof client.transaction>[0]) => {
        return originalTransaction(async (txClient) => {
          const originalQuery = txClient.query.bind(txClient);
          txClient.query = (async (...args: Parameters<typeof originalQuery>) => {
            const sqlText = String(args[0] ?? "");
            if (/insert into "?roll"?/i.test(sqlText)) {
              insertAttempts += 1;
              if (insertAttempts === 1) {
                const error = new Error("duplicate key value violates unique constraint") as Error & {
                  code: string;
                };
                error.code = "23505";
                throw error;
              }
            }
            return originalQuery(...args);
          }) as typeof txClient.query;

          return callback(txClient);
        });
      });

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    transactionSpy.mockRestore();

    expect(result.ok).toBe(true);
    expect(insertAttempts).toBe(2);
    expect(await db.select().from(roll)).toHaveLength(1);
  });
});

describe("createRollCore — BAG-2 decrement on load (R2-3)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("decrements qty by one and returns remainingQty when the stock is counted", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id, qty: 3 });

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok && result.remainingQty).toBe(2);
    const [bagRow] = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRow.qty).toBe(2);
  });

  it("removes the film from the bag when the last counted roll is loaded (owner 28.09.2026)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id, qty: 1 });

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok && result.remainingQty).toBe(0);
    const [bagRow] = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRow.deletedAt).not.toBeNull();
  });

  it("leaves qty alone and returns remainingQty null when the stock isn't counted (qty null)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id });

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok && result.remainingQty).toBeNull();
    const [bagRow] = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRow.qty).toBeNull();
  });

  it("leaves qty at 0 and returns remainingQty null, still creates the roll", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OWNER, kind: "stock", refId: stockRow.id, qty: 0 });

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.remainingQty).toBeNull();
    const [bagRow] = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRow.qty).toBe(0);
  });

  it("returns remainingQty null when the stock wasn't in the bag yet (it's added fresh, uncounted)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    expect(result.ok && result.remainingQty).toBeNull();
  });
});

describe("createRollCore — past-mode month-precision dates (R2-4)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("stores the month's first/last instant in Vietnam time and datePrecision month", async () => {
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
        shotFromMonth: { month: 4, year: 2026 },
        shotToMonth: { month: 5, year: 2026 },
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.datePrecision).toBe("month");
    expect(rollRow.shotFrom?.toISOString()).toBe("2026-03-31T17:00:00.000Z");
    expect(rollRow.shotTo?.toISOString()).toBe("2026-05-31T16:59:59.999Z");
  });

  it("'Không nhớ' on both sides: null dates, null precision", async () => {
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
        shotFromMonth: null,
        shotToMonth: null,
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.shotFrom).toBeNull();
    expect(rollRow.shotTo).toBeNull();
    expect(rollRow.datePrecision).toBeNull();
  });

  it("'Không nhớ' on one side only: that side stays null, precision still month", async () => {
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
        shotFromMonth: { month: 4, year: 2026 },
        shotToMonth: null,
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.shotFrom).not.toBeNull();
    expect(rollRow.shotTo).toBeNull();
    expect(rollRow.datePrecision).toBe("month");
  });

  it("rejects a future month (Vietnam time)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    // NOW is June 2026 — July 2026 is a future month.
    const result = await createRollCore(
      db,
      OWNER,
      {
        mode: "past",
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFromMonth: { month: 7, year: 2026 },
        shotToMonth: null,
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "validation" });
  });

  it("accepts the current Vietnam month (not future)", async () => {
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
        shotFromMonth: { month: 6, year: 2026 },
        shotToMonth: null,
      },
      NOW,
    );

    expect(result.ok).toBe(true);
  });

  it("rejects fromMonth after toMonth", async () => {
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
        shotFromMonth: { month: 5, year: 2026 },
        shotToMonth: { month: 4, year: 2026 },
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "validation" });
  });

  it("still accepts exact shotFrom/shotTo in past mode (backward compatible, day precision)", async () => {
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
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow.datePrecision).toBe("day");
  });
});

describe("createRollCore — N4 addStockToBag opt-out", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("does not bag a freshly-picked stock when addStockToBag is false", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id, addStockToBag: false },
      NOW,
    );

    expect(result.ok).toBe(true);
    const bagRows = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRows).toHaveLength(0);
  });

  it("still bags it when addStockToBag is omitted (backward compatible)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );

    const bagRows = await db
      .select()
      .from(bagItem)
      .where(and(eq(bagItem.userId, OWNER), eq(bagItem.refId, stockRow.id)));
    expect(bagRows).toHaveLength(1);
  });
});

describe("peekNextRollNumberCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("returns 1 for a user with no rolls yet", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    expect(await peekNextRollNumberCore(db, OWNER)).toBe(1);
  });

  it("returns one past the highest number already saved", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);
    await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);

    expect(await peekNextRollNumberCore(db, OWNER)).toBe(3);
  });

  it("never counts another user's rolls", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    await db.insert(bagItem).values({ userId: OTHER_USER, kind: "camera", refId: cameraBagItemRow.refId });

    await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);

    expect(await peekNextRollNumberCore(db, OTHER_USER)).toBe(1);
  });
});

describe("updateRollCore (R4)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("updates the roll's fields and bumps version", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    if (!created.ok) throw new Error("setup failed");

    const result = await updateRollCore(
      db,
      OWNER,
      {
        rollId: created.rollId,
        expectedVersion: 1,
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        name: "Đà Lạt",
        shotIso: 800,
      },
      NOW,
    );

    expect(result).toEqual({ ok: true });
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, created.rollId));
    expect(rollRow.name).toBe("Đà Lạt");
    expect(rollRow.shotIso).toBe(800);
    expect(rollRow.version).toBe(2);
  });

  it("rejects a stale expectedVersion", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    if (!created.ok) throw new Error("setup failed");

    const result = await updateRollCore(
      db,
      OWNER,
      {
        rollId: created.rollId,
        expectedVersion: 99,
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "stale_version" });
  });

  it("rejects another user's roll (owner isolation)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    if (!created.ok) throw new Error("setup failed");

    const result = await updateRollCore(
      db,
      OTHER_USER,
      {
        rollId: created.rollId,
        expectedVersion: 1,
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
      },
      NOW,
    );

    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("accepts month-precision dates on edit, same as create (R2-4)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const created = await createRollCore(
      db,
      OWNER,
      { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id },
      NOW,
    );
    if (!created.ok) throw new Error("setup failed");

    const result = await updateRollCore(
      db,
      OWNER,
      {
        rollId: created.rollId,
        expectedVersion: 1,
        stockId: stockRow.id,
        cameraBagItemId: cameraBagItemRow.id,
        shotFromMonth: { month: 10, year: 2025 },
        shotToMonth: null,
      },
      NOW,
    );

    expect(result).toEqual({ ok: true });
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, created.rollId));
    expect(rollRow.datePrecision).toBe("month");
    expect(rollRow.shotTo).toBeNull();
  });
});

describe("box ISO and format are required, prefilled from the stock (ROLL-1, owner 28.09.2026)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  async function seedStock(db: Awaited<ReturnType<typeof createTestDb>>["db"], values: { iso: number | null; formats: string[] | null }) {
    const [stockRow] = await db
      .insert(stock)
      .values({ brand: "Lomo", name: "Test", iso: values.iso, formats: values.formats, searchText: toSearchText("Lomo Test") })
      .returning();
    return stockRow;
  }

  it("defaults format to 35mm when none is sent", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);

    const result = await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow).toMatchObject({ boxIso: 400, format: "35mm" });
  });

  it("defaults format to 120 when the stock only comes in 120", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { cameraBagItemRow } = await seedBasics(db);
    const stockRow = await seedStock(db, { iso: 160, formats: ["120"] });

    const result = await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, result.rollId));
    expect(rollRow).toMatchObject({ boxIso: 160, format: "120" });
  });

  it("rejects a roll when neither the input nor the stock has a box ISO", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { cameraBagItemRow } = await seedBasics(db);
    const stockRow = await seedStock(db, { iso: null, formats: null });

    const result = await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);

    expect(result).toEqual({ ok: false, error: "validation" });
    expect(await db.select().from(roll)).toHaveLength(0);
  });

  it("accepts an ISO-less stock when the box ISO is typed in", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { cameraBagItemRow } = await seedBasics(db);
    const stockRow = await seedStock(db, { iso: null, formats: null });

    const result = await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id, boxIso: 100 }, NOW);

    expect(result.ok).toBe(true);
  });

  it("rejects an update that leaves the roll with no box ISO, and defaults its format", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();
    const { stockRow, cameraBagItemRow } = await seedBasics(db);
    const isoLess = await seedStock(db, { iso: null, formats: null });
    const created = await createRollCore(db, OWNER, { mode: "new", stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);
    if (!created.ok) throw new Error("setup failed");

    const rejected = await updateRollCore(db, OWNER, { rollId: created.rollId, expectedVersion: 1, stockId: isoLess.id, cameraBagItemId: cameraBagItemRow.id }, NOW);
    expect(rejected).toEqual({ ok: false, error: "validation" });

    const accepted = await updateRollCore(db, OWNER, { rollId: created.rollId, expectedVersion: 1, stockId: stockRow.id, cameraBagItemId: cameraBagItemRow.id }, NOW);
    expect(accepted).toEqual({ ok: true });
    const [rollRow] = await db.select().from(roll).where(eq(roll.id, created.rollId));
    expect(rollRow).toMatchObject({ boxIso: 400, format: "35mm" });
  });
});
