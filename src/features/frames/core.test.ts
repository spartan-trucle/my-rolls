import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { frame, mistake, note, roll } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { seedRollWithFrames } from "@/test/phase2-fixtures";
import { deleteFrameCore, listRollFramesCore, moveFrameCore, restoreFrameCore, setFrameMarksCore, setFramesMarksCore } from "./core";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

const USER = "user-1";
const OTHER = "user-2";
const PUBLIC = "https://img.example";

async function setup(n = 5) {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  return { db, ...(await seedRollWithFrames(db, USER, n)) };
}

const version = async (db: Awaited<ReturnType<typeof setup>>["db"], id: string) =>
  (await db.select({ v: roll.version }).from(roll).where(eq(roll.id, id)))[0].v;

describe("setFrameMarksCore (SCAN-4, D3)", () => {
  it("refuses another user's frame", async () => {
    const { db, frames } = await setup(1);
    expect(await setFrameMarksCore(db, OTHER, { frameId: frames[0].id, isKeeper: true })).toEqual({ ok: false, error: "not_found" });
  });

  it("marks tấm ưng, and marking blank clears it (and the reverse)", async () => {
    const { db, frames } = await setup(1);
    const id = frames[0].id;
    await setFrameMarksCore(db, USER, { frameId: id, isKeeper: true });
    await setFrameMarksCore(db, USER, { frameId: id, isBlank: true });
    let [row] = await db.select().from(frame).where(eq(frame.id, id));
    expect(row).toMatchObject({ isKeeper: false, isBlank: true });
    await setFrameMarksCore(db, USER, { frameId: id, isKeeper: true });
    [row] = await db.select().from(frame).where(eq(frame.id, id));
    expect(row).toMatchObject({ isKeeper: true, isBlank: false });
  });

  it("bumps roll.version by one per change (D19)", async () => {
    const { db, frames, roll: r } = await setup(1);
    await setFrameMarksCore(db, USER, { frameId: frames[0].id, isKeeper: true });
    expect(await version(db, r.id)).toBe(2);
  });
});

describe("moveFrameCore (SCAN-2 reorder)", () => {
  it("moves frame 5 to position 2 and shifts 2–4 down", async () => {
    const { db, frames, roll: r } = await setup(5);
    expect(await moveFrameCore(db, USER, { frameId: frames[4].id, toPosition: 2 })).toEqual({ ok: true });
    const rows = await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position);
    expect(rows.map((f) => f.id)).toEqual([frames[0].id, frames[4].id, frames[1].id, frames[2].id, frames[3].id]);
    expect(rows.map((f) => f.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it("moves frame 1 to position 3 and shifts 2–3 up", async () => {
    const { db, frames, roll: r } = await setup(4);
    await moveFrameCore(db, USER, { frameId: frames[0].id, toPosition: 3 });
    const rows = await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position);
    expect(rows.map((f) => f.id)).toEqual([frames[1].id, frames[2].id, frames[0].id, frames[3].id]);
  });

  it("clamps a position past the end, and refuses another user's frame", async () => {
    const { db, frames, roll: r } = await setup(3);
    await moveFrameCore(db, USER, { frameId: frames[0].id, toPosition: 99 });
    const rows = await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position);
    expect(rows.at(-1)?.id).toBe(frames[0].id);
    expect(await moveFrameCore(db, OTHER, { frameId: frames[0].id, toPosition: 1 })).toEqual({ ok: false, error: "not_found" });
  });
});

describe("moveFrameCore with gaps and pending frames (review #3)", () => {
  it("moves by place among ready, live frames and renumbers them 1..N", async () => {
    const { db, frames, roll: r } = await setup(4);
    await db.update(frame).set({ deletedAt: new Date() }).where(eq(frame.id, frames[1].id));
    await db.update(frame).set({ status: "pending" }).where(eq(frame.id, frames[2].id));
    // Ready and live: frames[0] (pos 1) and frames[3] (pos 4). Move the last one to place 1.
    expect(await moveFrameCore(db, USER, { frameId: frames[3].id, toPosition: 1 })).toEqual({ ok: true });
    const live = await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position);
    const ready = live.filter((f) => f.deletedAt === null && f.status === "ready");
    expect(ready.map((f) => [f.id, f.position])).toEqual([
      [frames[3].id, 1],
      [frames[0].id, 2],
    ]);
  });

  it("clamps to the number of ready frames, not every row", async () => {
    const { db, frames, roll: r } = await setup(3);
    await db.update(frame).set({ status: "pending" }).where(eq(frame.id, frames[2].id));
    await moveFrameCore(db, USER, { frameId: frames[0].id, toPosition: 3 });
    const ready = (await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position)).filter(
      (f) => f.status === "ready",
    );
    expect(ready.map((f) => [f.id, f.position])).toEqual([
      [frames[1].id, 1],
      [frames[0].id, 2],
    ]);
  });
});

describe("deleteFrameCore / restoreFrameCore (D23)", () => {
  it("soft-deletes and restores the owner's frame only", async () => {
    const { db, frames } = await setup(2);
    expect(await deleteFrameCore(db, OTHER, { frameId: frames[0].id })).toEqual({ ok: false, error: "not_found" });
    await deleteFrameCore(db, USER, { frameId: frames[0].id });
    let [row] = await db.select().from(frame).where(eq(frame.id, frames[0].id));
    expect(row.deletedAt).not.toBeNull();
    await restoreFrameCore(db, USER, { frameId: frames[0].id });
    [row] = await db.select().from(frame).where(eq(frame.id, frames[0].id));
    expect(row.deletedAt).toBeNull();
  });
});

describe("listRollFramesCore", () => {
  it("lists ready, live frames by position with public urls, oops and note counts", async () => {
    const { db, frames, roll: r } = await setup(3);
    await db.update(frame).set({ status: "pending" }).where(eq(frame.id, frames[1].id));
    await db.update(frame).set({ deletedAt: new Date() }).where(eq(frame.id, frames[2].id));
    await db.insert(mistake).values({ userId: USER, rollId: r.id, frameId: frames[0].id, type: "light_leak" });
    await db.insert(note).values([
      { userId: USER, rollId: r.id, frameId: frames[0].id, body: "lọt sáng ở đây" },
      { userId: USER, rollId: r.id, frameId: null, body: "cả cuộn" },
    ]);

    const list = await listRollFramesCore(db, USER, r.id, { publicUrl: PUBLIC });
    expect(list).toEqual([
      {
        id: frames[0].id,
        position: 1,
        gridUrl: `${PUBLIC}/grid/g1.webp`,
        viewUrl: `${PUBLIC}/view/v1.webp`,
        width: 3000,
        height: 2000,
        isKeeper: false,
        isBlank: false,
        isOops: true,
        noteCount: 1,
      },
    ]);
    expect(await listRollFramesCore(db, OTHER, r.id, { publicUrl: PUBLIC })).toEqual([]);
  });
});

describe("setFramesMarksCore (COL-4, D12)", () => {
  it("sets tấm ưng on every selected frame and clears blank on them, with one version bump", async () => {
    const { db, frames, roll: r } = await setup(4);
    await db.update(frame).set({ isBlank: true }).where(eq(frame.id, frames[0].id));
    const ids = [frames[0].id, frames[1].id, frames[2].id];
    expect(await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: ids, mark: "keeper", on: true })).toEqual({ ok: true });
    const rows = await db.select().from(frame).where(eq(frame.rollId, r.id)).orderBy(frame.position);
    expect(rows.map((f) => [f.isKeeper, f.isBlank])).toEqual([
      [true, false],
      [true, false],
      [true, false],
      [false, false],
    ]);
    expect(await version(db, r.id)).toBe(2);
  });

  it("blank on clears tấm ưng; off removes only that mark", async () => {
    const { db, frames, roll: r } = await setup(2);
    const ids = frames.map((f) => f.id);
    await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: ids, mark: "keeper", on: true });
    await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: ids, mark: "blank", on: true });
    let rows = await db.select().from(frame).where(eq(frame.rollId, r.id));
    expect(rows.every((f) => f.isBlank && !f.isKeeper)).toBe(true);
    await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: ids, mark: "blank", on: false });
    rows = await db.select().from(frame).where(eq(frame.rollId, r.id));
    expect(rows.every((f) => !f.isBlank && !f.isKeeper)).toBe(true);
  });

  it("changes nothing when any id isn't a live frame of this user's roll", async () => {
    const { db, frames, roll: r } = await setup(2);
    const other = await seedRollWithFrames(db, USER, 1);
    const result = await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: [frames[0].id, other.frames[0].id], mark: "keeper", on: true });
    expect(result).toEqual({ ok: false, error: "not_found" });
    const [row] = await db.select().from(frame).where(eq(frame.id, frames[0].id));
    expect(row.isKeeper).toBe(false);
    expect(await setFramesMarksCore(db, OTHER, { rollId: r.id, frameIds: [frames[0].id], mark: "keeper", on: true })).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(await version(db, r.id)).toBe(1);
  });

  it("an empty list or more than 500 ids is refused without writing", async () => {
    const { db, roll: r } = await setup(1);
    expect(await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: [], mark: "keeper", on: true })).toEqual({ ok: false, error: "not_found" });
    const many = Array.from({ length: 501 }, () => crypto.randomUUID());
    expect(await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: many, mark: "keeper", on: true })).toEqual({ ok: false, error: "not_found" });
    expect(await version(db, r.id)).toBe(1);
  });

  it("duplicate ids are harmless", async () => {
    const { db, frames, roll: r } = await setup(2);
    const id = frames[0].id;
    expect(await setFramesMarksCore(db, USER, { rollId: r.id, frameIds: [id, id], mark: "keeper", on: true })).toEqual({ ok: true });
    const [row] = await db.select().from(frame).where(eq(frame.id, id));
    expect(row.isKeeper).toBe(true);
    expect(await version(db, r.id)).toBe(2);
  });
});
