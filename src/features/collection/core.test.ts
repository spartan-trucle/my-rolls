import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { frame, mistake, roll } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { seedRollWithFrames } from "@/test/phase2-fixtures";
import { listLibraryCore } from "./core";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

const USER = "user-1";
const PUBLIC = "https://img.example";

async function setup() {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  return db;
}

/** Rolls created one second apart, oldest first, so "newest first" is testable. */
async function seedRolls(db: Awaited<ReturnType<typeof setup>>, sizes: number[], userId = USER) {
  const out = [];
  for (const [i, n] of sizes.entries()) {
    out.push(await seedRollWithFrames(db, userId, n, { createdAt: new Date(Date.UTC(2026, 10, 1, 0, 0, i)) }));
  }
  return out;
}

describe("listLibraryCore (COL-3, D9)", () => {
  it("groups ready frames by roll, newest roll first, frames by position", async () => {
    const db = await setup();
    const [older, newer] = await seedRolls(db, [2, 3]);
    const page = await listLibraryCore(db, USER, { filter: "all", publicUrl: PUBLIC });
    expect(page.groups.map((g) => g.roll.id)).toEqual([newer.roll.id, older.roll.id]);
    expect(page.groups[0].frames.map((f) => f.position)).toEqual([1, 2, 3]);
    expect(page.groups[0].frames[0].gridUrl).toBe(`${PUBLIC}/grid/g1.webp`);
  });

  it("skips rolls with no ready frames, and never shows pending, deleted or other users' frames (Review Focus 5)", async () => {
    const db = await setup();
    const [empty, withFrames] = await seedRolls(db, [0, 3]);
    await seedRolls(db, [4], "user-2");
    await db.update(frame).set({ status: "pending" }).where(eq(frame.id, withFrames.frames[0].id));
    await db.update(frame).set({ deletedAt: new Date() }).where(eq(frame.id, withFrames.frames[1].id));

    const page = await listLibraryCore(db, USER, { filter: "all", publicUrl: PUBLIC });
    expect(page.groups.map((g) => g.roll.id)).toEqual([withFrames.roll.id]);
    expect(page.groups[0].frames.map((f) => f.id)).toEqual([withFrames.frames[2].id]);
    expect(page.totals).toEqual({ rolls: 2, frames: 1, keepers: 0 });
    expect(page.groups.some((g) => g.roll.id === empty.roll.id)).toBe(false);
  });

  it("filters to tấm ưng across the library and skips rolls with none", async () => {
    const db = await setup();
    const [a, b] = await seedRolls(db, [3, 3]);
    await db.update(frame).set({ isKeeper: true }).where(eq(frame.id, a.frames[1].id));
    const page = await listLibraryCore(db, USER, { filter: "keeper", publicUrl: PUBLIC });
    expect(page.groups.map((g) => g.roll.id)).toEqual([a.roll.id]);
    expect(page.groups[0].frames.map((f) => f.id)).toEqual([a.frames[1].id]);
    expect(page.counts).toEqual({ all: 6, keeper: 1, oops: 0 });
    expect(page.groups.some((g) => g.roll.id === b.roll.id)).toBe(false);
  });

  it("oops = has a live mistake on the frame; a roll-level mistake doesn't count", async () => {
    const db = await setup();
    const [r] = await seedRolls(db, [2]);
    await db.insert(mistake).values([
      { userId: USER, rollId: r.roll.id, frameId: r.frames[0].id, type: "light_leak" },
      { userId: USER, rollId: r.roll.id, frameId: null, type: "opened_back" },
      { userId: USER, rollId: r.roll.id, frameId: r.frames[1].id, type: "camera_shake", deletedAt: new Date() },
    ]);
    const page = await listLibraryCore(db, USER, { filter: "oops", publicUrl: PUBLIC });
    expect(page.groups[0].frames.map((f) => f.id)).toEqual([r.frames[0].id]);
    expect(page.counts.oops).toBe(1);
  });

  it("pages by roll with a cursor and ends with nextCursor null", async () => {
    const db = await setup();
    const rolls = await seedRolls(db, [1, 1, 1]);
    const first = await listLibraryCore(db, USER, { filter: "all", pageSize: 2, publicUrl: PUBLIC });
    expect(first.groups).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await listLibraryCore(db, USER, { filter: "all", pageSize: 2, cursor: first.nextCursor, publicUrl: PUBLIC });
    expect(second.groups.map((g) => g.roll.id)).toEqual([rolls[0].roll.id]);
    expect(second.nextCursor).toBeNull();
  });

  it("treats a malformed cursor as the first page", async () => {
    const db = await setup();
    await seedRolls(db, [1]);
    const page = await listLibraryCore(db, USER, { filter: "all", cursor: "garbage", publicUrl: PUBLIC });
    expect(page.groups).toHaveLength(1);
  });

  it("ignores soft-deleted rolls entirely", async () => {
    const db = await setup();
    const [r] = await seedRolls(db, [2]);
    await db.update(roll).set({ deletedAt: new Date() }).where(eq(roll.id, r.roll.id));
    const page = await listLibraryCore(db, USER, { filter: "all", publicUrl: PUBLIC });
    expect(page).toMatchObject({ groups: [], totals: { rolls: 0, frames: 0, keepers: 0 } });
  });
});
