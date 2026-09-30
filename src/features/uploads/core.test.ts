import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { frame, roll, scanSet } from "@/db/schema";
import { createTestDb, type TTestDb } from "@/db/test-db";
import { confirmFramesCore, getOriginalKeyCore, requestSlotsCore, type ISlotFile } from "./core";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

const USER = "user-1";
const OTHER = "user-2";

async function setup() {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  const [mine] = await db
    .insert(roll)
    .values({ userId: USER, stockId: randomUUID(), cameraBagItemId: randomUUID() })
    .returning();
  const [theirs] = await db
    .insert(roll)
    .values({ userId: OTHER, stockId: randomUUID(), cameraBagItemId: randomUUID() })
    .returning();
  return { db, rollId: mine.id, otherRollId: theirs.id };
}

function file(n: number, overrides: Partial<ISlotFile> = {}): ISlotFile {
  return {
    clientId: `c${n}`,
    fileName: `${String(n).padStart(2, "0")}.jpg`,
    contentType: "image/jpeg",
    bytes: 1000 + n,
    sha256: "a".repeat(64),
    width: 3000,
    height: 2000,
    exif: { Make: "NORITSU" },
    position: n,
    copyType: "image/webp",
    gridBytes: 20_000,
    viewBytes: 300_000,
    ...overrides,
  };
}

const sign = vi.fn(async ({ bucket, key }: { bucket: string; key: string }) => `https://signed/${bucket}/${key}`);

describe("requestSlotsCore", () => {
  it("refuses another user's roll and inserts nothing", async () => {
    const { db, otherRollId } = await setup();
    const result = await requestSlotsCore(db, USER, { rollId: otherRollId, files: [file(1)] }, { sign });
    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(await db.select().from(frame)).toHaveLength(0);
    expect(await db.select().from(scanSet)).toHaveLength(0);
  });

  it("creates the roll's scan set on the first call and reuses it on the next", async () => {
    const { db, rollId } = await setup();
    const first = await requestSlotsCore(db, USER, { rollId, files: [file(1)] }, { sign });
    const second = await requestSlotsCore(db, USER, { rollId, files: [file(2)] }, { sign });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.scanSetId).toBe(first.scanSetId);
    expect(await db.select().from(scanSet)).toHaveLength(1);
  });

  it("refuses more than 12 files in one call", async () => {
    const { db, rollId } = await setup();
    const files = Array.from({ length: 13 }, (_, i) => file(i + 1));
    expect(await requestSlotsCore(db, USER, { rollId, files }, { sign })).toEqual({ ok: false, error: "too_many" });
  });

  it("refuses a file over 10 MB or a TIFF, naming it", async () => {
    const { db, rollId } = await setup();
    const big = await requestSlotsCore(db, USER, { rollId, files: [file(1), file(2, { bytes: 10 * 1024 * 1024 + 1 })] }, { sign });
    expect(big).toEqual({ ok: false, error: "invalid_file", clientId: "c2" });
    const tiff = await requestSlotsCore(
      db,
      USER,
      { rollId, files: [file(3, { contentType: "image/tiff" as ISlotFile["contentType"] })] },
      { sign },
    );
    expect(tiff).toEqual({ ok: false, error: "invalid_file", clientId: "c3" });
    expect(await db.select().from(frame)).toHaveLength(0);
  });

  it("inserts pending frames with the D10 keys and signs three urls per file", async () => {
    const { db, rollId } = await setup();
    sign.mockClear();
    const result = await requestSlotsCore(db, USER, { rollId, files: [file(1), file(2, { copyType: "image/jpeg", contentType: "image/png" })] }, { sign });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = await db.select().from(frame);
    expect(rows).toHaveLength(2);
    const one = rows.find((r) => r.position === 1)!;
    const two = rows.find((r) => r.position === 2)!;
    expect(one.status).toBe("pending");
    expect(one.userId).toBe(USER);
    expect(one.rollId).toBe(rollId);
    expect(one.originalKey).toBe(`originals/${USER}/${one.id}.jpg`);
    expect(one.gridKey).toMatch(/^grid\/[0-9a-f-]{36}\.webp$/);
    expect(one.viewKey).toMatch(/^view\/[0-9a-f-]{36}\.webp$/);
    expect(one.gridKey).not.toContain(one.id);
    expect(two.originalKey).toBe(`originals/${USER}/${two.id}.png`);
    expect(two.gridKey).toMatch(/\.jpg$/);

    expect(sign).toHaveBeenCalledTimes(6);
    expect(sign).toHaveBeenCalledWith({ bucket: "originals", key: one.originalKey, contentType: "image/jpeg", size: 1001 });
    expect(sign).toHaveBeenCalledWith({ bucket: "public", key: one.gridKey, contentType: "image/webp", size: 20_000 });
    const slot = result.slots.find((s) => s.clientId === "c1")!;
    expect(slot).toEqual({
      clientId: "c1",
      frameId: one.id,
      originalUrl: `https://signed/originals/${one.originalKey}`,
      gridUrl: `https://signed/public/${one.gridKey}`,
      viewUrl: `https://signed/public/${one.viewKey}`,
    });
  });
});

describe("confirmFramesCore", () => {
  async function withSlots(db: TTestDb, rollId: string, n = 2) {
    const result = await requestSlotsCore(db, USER, { rollId, files: Array.from({ length: n }, (_, i) => file(i + 1)) }, { sign });
    if (!result.ok) throw new Error("slots failed");
    return db.select().from(frame).orderBy(frame.position);
  }

  it("marks a frame ready when all three objects exist and the original has its size", async () => {
    const { db, rollId } = await setup();
    const [one] = await withSlots(db, rollId, 1);
    const head = vi.fn(async ({ key }: { bucket: string; key: string }) => ({ contentLength: key === one.originalKey ? one.bytes : 10 }));

    expect(await confirmFramesCore(db, USER, [one.id], { head })).toEqual({ ready: [one.id], missing: [] });
    const [row] = await db.select().from(frame).where(eq(frame.id, one.id));
    expect(row.status).toBe("ready");
  });

  it("leaves a frame pending and lists it missing when the original's size is wrong or a copy is absent", async () => {
    const { db, rollId } = await setup();
    const [one, two] = await withSlots(db, rollId, 2);
    const head = vi.fn(async ({ key }: { bucket: string; key: string }) => {
      if (key === one.originalKey) return { contentLength: one.bytes - 1 };
      if (key === two.viewKey) return null;
      return { contentLength: key === two.originalKey ? two.bytes : 10 };
    });

    const result = await confirmFramesCore(db, USER, [one.id, two.id], { head });
    expect(result.ready).toEqual([]);
    expect(result.missing.sort()).toEqual([one.id, two.id].sort());
    const rows = await db.select().from(frame);
    expect(rows.every((r) => r.status === "pending")).toBe(true);
  });

  it("ignores another user's frame ids without listing them", async () => {
    const { db, rollId } = await setup();
    const [one] = await withSlots(db, rollId, 1);
    const head = vi.fn(async () => ({ contentLength: one.bytes }));
    expect(await confirmFramesCore(db, OTHER, [one.id], { head })).toEqual({ ready: [], missing: [] });
    expect(head).not.toHaveBeenCalled();
  });

  it("doesn't bump roll.version (D19: only marks, mistakes and memory do)", async () => {
    const { db, rollId } = await setup();
    const [one] = await withSlots(db, rollId, 1);
    await confirmFramesCore(db, USER, [one.id], {
      head: async ({ key }) => ({ contentLength: key === one.originalKey ? one.bytes : 1 }),
    });
    const [r] = await db.select().from(roll).where(eq(roll.id, rollId));
    expect(r.version).toBe(1);
  });
});

describe("getOriginalKeyCore", () => {
  it("returns the key only for the owner's ready, live frame", async () => {
    const { db, rollId } = await setup();
    const result = await requestSlotsCore(db, USER, { rollId, files: [file(1)] }, { sign });
    if (!result.ok) throw new Error("slots failed");
    const [row] = await db.select().from(frame);

    expect(await getOriginalKeyCore(db, USER, row.id)).toBeNull();
    await db.update(frame).set({ status: "ready" }).where(eq(frame.id, row.id));
    expect(await getOriginalKeyCore(db, USER, row.id)).toBe(row.originalKey);
    expect(await getOriginalKeyCore(db, OTHER, row.id)).toBeNull();
    await db.update(frame).set({ deletedAt: new Date() }).where(eq(frame.id, row.id));
    expect(await getOriginalKeyCore(db, USER, row.id)).toBeNull();
  });
});
