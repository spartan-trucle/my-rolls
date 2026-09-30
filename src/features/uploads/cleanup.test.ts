import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { frame } from "@/db/schema";
import { createTestDb, type TTestDb } from "@/db/test-db";
import { cleanupPendingFramesCore, isCronAuthorized } from "./cleanup";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

const NOW = new Date("2026-11-10T20:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

async function seed(db: TTestDb, rows: Array<{ status: "pending" | "ready"; age: number }>) {
  const values = rows.map((r, i) => {
    const id = randomUUID();
    return {
      id,
      userId: "u1",
      rollId: randomUUID(),
      scanSetId: randomUUID(),
      position: i + 1,
      fileName: `${i}.jpg`,
      contentType: "image/jpeg",
      bytes: 10,
      originalKey: `originals/u1/${id}.jpg`,
      gridKey: `grid/${randomUUID()}.webp`,
      viewKey: `view/${randomUUID()}.webp`,
      status: r.status,
      createdAt: hoursAgo(r.age),
    };
  });
  for (let i = 0; i < values.length; i += 200) await db.insert(frame).values(values.slice(i, i + 200));
  return values;
}

async function freshDb() {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  return db;
}

describe("cleanupPendingFramesCore (D17)", () => {
  it("hard-deletes frames pending for more than 24 h, with their three objects", async () => {
    const db = await freshDb();
    const [stale] = await seed(db, [{ status: "pending", age: 25 }]);
    const deleteObjects = vi.fn().mockResolvedValue(undefined);

    expect(await cleanupPendingFramesCore(db, { now: NOW, deleteObjects })).toEqual({ deleted: 1 });
    expect(await db.select().from(frame)).toHaveLength(0);
    expect(deleteObjects).toHaveBeenCalledWith({ bucket: "originals", keys: [stale.originalKey] });
    expect(deleteObjects).toHaveBeenCalledWith({ bucket: "public", keys: [stale.gridKey, stale.viewKey] });
  });

  it("leaves frames pending for 23 h, and ready frames of any age", async () => {
    const db = await freshDb();
    await seed(db, [
      { status: "pending", age: 23 },
      { status: "ready", age: 500 },
    ]);
    const deleteObjects = vi.fn().mockResolvedValue(undefined);

    expect(await cleanupPendingFramesCore(db, { now: NOW, deleteObjects })).toEqual({ deleted: 0 });
    expect(await db.select().from(frame)).toHaveLength(2);
    expect(deleteObjects).not.toHaveBeenCalled();
  });

  it("deletes at most 500 frames a run", async () => {
    const db = await freshDb();
    await seed(db, Array.from({ length: 600 }, () => ({ status: "pending" as const, age: 30 })));
    const deleteObjects = vi.fn().mockResolvedValue(undefined);

    expect(await cleanupPendingFramesCore(db, { now: NOW, deleteObjects })).toEqual({ deleted: 500 });
    expect(await db.select().from(frame)).toHaveLength(100);
  });

  it("never deletes a row that became ready while the cleanup ran (review #8)", async () => {
    const db = await freshDb();
    const [stale] = await seed(db, [{ status: "pending", age: 30 }]);
    // The frame is confirmed between the cleanup's select and its row delete.
    const deleteObjects = vi.fn(async () => {
      await db.update(frame).set({ status: "ready" }).where(eq(frame.id, stale.id));
    });
    await cleanupPendingFramesCore(db, { now: NOW, deleteObjects });
    expect(await db.select().from(frame)).toHaveLength(1);
  });

  it("deletes no rows when R2 fails, so no row is left pointing at a missing object", async () => {
    const db = await freshDb();
    await seed(db, [{ status: "pending", age: 30 }]);
    const deleteObjects = vi.fn().mockRejectedValue(new Error("r2 down"));

    await expect(cleanupPendingFramesCore(db, { now: NOW, deleteObjects })).rejects.toThrow("r2 down");
    expect(await db.select().from(frame)).toHaveLength(1);
  });
});

describe("isCronAuthorized", () => {
  it("accepts only 'Bearer <secret>', and nothing at all when the secret is unset", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
  });
});
