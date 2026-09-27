import { afterEach, describe, expect, it, vi } from "vitest";
import { bagItem, camera, lens, stock } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { addCustomCameraCore, addCustomLensCore, addCustomStockCore } from "./core";

const OWNER = "user-1";

describe("addCustomStockCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("inserts the stock and its bag item together (D12), private to the owner", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addCustomStockCore(db, OWNER, {
      brand: "Fomapan",
      name: "400 Action",
      iso: 400,
      formats: ["35mm"],
      type: "bw",
    });

    expect(result.ok).toBe(true);

    const stockRows = await db.select().from(stock);
    expect(stockRows).toHaveLength(1);
    expect(stockRows[0]).toMatchObject({ ownerId: OWNER, brand: "Fomapan", name: "400 Action" });
    expect(stockRows[0].searchText).toBe("fomapan 400 action");

    const bagRows = await db.select().from(bagItem);
    expect(bagRows).toHaveLength(1);
    expect(bagRows[0]).toMatchObject({ userId: OWNER, kind: "stock", refId: stockRows[0].id });
  });

  it("stores the canister colour (D1's 'Loại film' chips) when given, null otherwise", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const withColor = await addCustomStockCore(db, OWNER, {
      brand: "Lomography",
      name: "Color 400",
      canisterColor: "rose",
    });
    expect(withColor.ok).toBe(true);

    const withoutColor = await addCustomStockCore(db, OWNER, { brand: "Fomapan", name: "100" });
    expect(withoutColor.ok).toBe(true);

    const stockRows = await db.select().from(stock);
    expect(stockRows.find((row) => row.name === "Color 400")).toMatchObject({ canisterColor: "rose" });
    expect(stockRows.find((row) => row.name === "100")).toMatchObject({ canisterColor: null });
  });

  it("rolls back the stock insert if the bag item insert fails — no orphan custom stock (D12)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    // PGlite's own transaction runs the callback against a fresh
    // transactional client — patch that client's `query` to fail the
    // `bag_item` insert specifically, so the earlier `stock` insert in
    // the same `db.transaction()` (`addCustomStockCore`) has something
    // real to roll back against.
    const originalTransaction = client.transaction.bind(client);
    const transactionSpy = vi
      .spyOn(client, "transaction")
      .mockImplementation(async (callback: Parameters<typeof client.transaction>[0]) => {
        return originalTransaction(async (txClient) => {
          const originalQuery = txClient.query.bind(txClient);
          txClient.query = (async (...args: Parameters<typeof originalQuery>) => {
            const sqlText = String(args[0] ?? "");
            if (/insert into "?bag_item"?/i.test(sqlText)) {
              throw new Error("boom: simulated bag insert failure");
            }
            return originalQuery(...args);
          }) as typeof txClient.query;

          return callback(txClient);
        });
      });

    await expect(
      addCustomStockCore(db, OWNER, { brand: "Fomapan", name: "400 Action" }),
    ).rejects.toThrow(/bag_item/);

    transactionSpy.mockRestore();

    expect(await db.select().from(stock)).toHaveLength(0);
    expect(await db.select().from(bagItem)).toHaveLength(0);
  });
});

describe("addCustomCameraCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("inserts the camera and its bag item together, private to the owner", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addCustomCameraCore(db, OWNER, { brand: "Zenit", model: "E" });

    expect(result.ok).toBe(true);

    const cameraRows = await db.select().from(camera);
    expect(cameraRows).toHaveLength(1);
    expect(cameraRows[0]).toMatchObject({ ownerId: OWNER, brand: "Zenit", model: "E" });

    const bagRows = await db.select().from(bagItem);
    expect(bagRows[0]).toMatchObject({ userId: OWNER, kind: "camera", refId: cameraRows[0].id });
  });

  it("stores the format (CustomEntry's 35mm/120 segment) when given, null otherwise", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await addCustomCameraCore(db, OWNER, { brand: "Yashica", model: "Mat-124G", format: "120" });
    await addCustomCameraCore(db, OWNER, { brand: "Canon", model: "AE-1" });

    const cameraRows = await db.select().from(camera);
    expect(cameraRows.find((row) => row.model === "Mat-124G")).toMatchObject({ format: "120" });
    expect(cameraRows.find((row) => row.model === "AE-1")).toMatchObject({ format: null });
  });
});

describe("addCustomLensCore", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("inserts the lens and its bag item together, private to the owner (D3)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addCustomLensCore(db, OWNER, {
      brand: "Helios",
      model: "44-2",
      focalLength: "58mm",
    });

    expect(result.ok).toBe(true);

    const lensRows = await db.select().from(lens);
    expect(lensRows).toHaveLength(1);
    expect(lensRows[0]).toMatchObject({
      ownerId: OWNER,
      brand: "Helios",
      model: "44-2",
      focalLength: "58mm",
    });

    const bagRows = await db.select().from(bagItem);
    expect(bagRows[0]).toMatchObject({ userId: OWNER, kind: "lens", refId: lensRows[0].id });
  });
});
