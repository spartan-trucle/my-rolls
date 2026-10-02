import { and, eq, isNull } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { mistake, roll } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { raceInTransaction, writesOnlyInTransaction } from "@/test/db-race";
import { seedRollWithFrames } from "@/test/phase2-fixtures";
import { addMistakesToFramesCore, listRollMistakesCore, setMistakesCore } from "./core";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

const USER = "user-1";
const OTHER = "user-2";

async function setup(n = 2) {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  return { db, ...(await seedRollWithFrames(db, USER, n)) };
}

const live = (db: Awaited<ReturnType<typeof setup>>["db"]) => db.select().from(mistake).where(isNull(mistake.deletedAt));

describe("setMistakesCore (NOTE-2, D4)", () => {
  it("replaces a frame's set: keeps the row that stays, adds the new one", async () => {
    const { db, roll: r, frames } = await setup();
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[0].id, items: [{ type: "light_leak" }] });
    const [first] = await live(db);
    await setMistakesCore(db, USER, {
      rollId: r.id,
      frameId: frames[0].id,
      items: [{ type: "light_leak", note: "góc trái" }, { type: "camera_shake" }],
    });
    const rows = await live(db);
    expect(rows.map((m) => m.type).sort()).toEqual(["camera_shake", "light_leak"]);
    const leak = rows.find((m) => m.type === "light_leak")!;
    expect(leak.id).toBe(first.id);
    expect(leak.note).toBe("góc trái");
  });

  it("clears the set with an empty list", async () => {
    const { db, roll: r, frames } = await setup();
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[0].id, items: [{ type: "light_leak" }] });
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[0].id, items: [] });
    expect(await live(db)).toHaveLength(0);
  });

  it("keeps roll-level and frame-level sets apart", async () => {
    const { db, roll: r, frames } = await setup();
    await setMistakesCore(db, USER, { rollId: r.id, frameId: null, items: [{ type: "wrong_iso" }] });
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[0].id, items: [{ type: "wrong_iso" }] });
    await setMistakesCore(db, USER, { rollId: r.id, frameId: null, items: [] });
    const rows = await live(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].frameId).toBe(frames[0].id);
  });

  it("refuses another user's roll, and a frame from another roll", async () => {
    const { db, roll: r } = await setup();
    expect(await setMistakesCore(db, OTHER, { rollId: r.id, frameId: null, items: [{ type: "other" }] })).toEqual({
      ok: false,
      error: "not_found",
    });
    const other = await seedRollWithFrames(db, USER, 1);
    expect(
      await setMistakesCore(db, USER, { rollId: r.id, frameId: other.frames[0].id, items: [{ type: "other" }] }),
    ).toEqual({ ok: false, error: "not_found" });
  });

  it("refuses an unknown type and a duplicated type", async () => {
    const { db, roll: r } = await setup();
    expect(
      await setMistakesCore(db, USER, { rollId: r.id, frameId: null, items: [{ type: "bad" as "other" }] }),
    ).toEqual({ ok: false, error: "invalid_input" });
    expect(
      await setMistakesCore(db, USER, { rollId: r.id, frameId: null, items: [{ type: "other" }, { type: "other" }] }),
    ).toEqual({ ok: false, error: "invalid_input" });
  });

  it("bumps roll.version once per call (D19)", async () => {
    const { db, roll: r } = await setup();
    await setMistakesCore(db, USER, { rollId: r.id, frameId: null, items: [{ type: "other" }, { type: "wrong_iso" }] });
    const [row] = await db.select().from(roll).where(eq(roll.id, r.id));
    expect(row.version).toBe(2);
  });
});

describe("listRollMistakesCore", () => {
  it("lists the roll's live mistakes, owner-scoped", async () => {
    const { db, roll: r, frames } = await setup();
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[1].id, items: [{ type: "missed_focus", note: "mờ" }] });
    const list = await listRollMistakesCore(db, USER, r.id);
    expect(list).toEqual([{ id: expect.any(String), frameId: frames[1].id, type: "missed_focus", note: "mờ" }]);
    expect(await listRollMistakesCore(db, OTHER, r.id)).toEqual([]);
    const rows = await db.select().from(mistake).where(and(eq(mistake.rollId, r.id)));
    expect(rows).toHaveLength(1);
  });
});

describe("addMistakesToFramesCore (COL-4 bulk oops, D13)", () => {
  it("adds the picked types to every frame and keeps their existing mistakes", async () => {
    const { db, frames, roll: r } = await setup(3);
    await setMistakesCore(db, USER, { rollId: r.id, frameId: frames[0].id, items: [{ type: "light_leak" }] });
    const ids = frames.map((f) => f.id);
    expect(
      await addMistakesToFramesCore(db, USER, { rollId: r.id, frameIds: ids, items: [{ type: "camera_shake", note: "run" }, { type: "light_leak" }] }),
    ).toEqual({ ok: true });

    const rows = await db.select().from(mistake).where(and(eq(mistake.rollId, r.id), isNull(mistake.deletedAt)));
    const byFrame = (id: string) => rows.filter((m) => m.frameId === id).map((m) => m.type).sort();
    expect(byFrame(frames[0].id)).toEqual(["camera_shake", "light_leak"]);
    expect(byFrame(frames[2].id)).toEqual(["camera_shake", "light_leak"]);
    expect(rows.find((m) => m.frameId === frames[1].id && m.type === "camera_shake")?.note).toBe("run");
  });

  it("writes the rows and the version bump in its one transaction (D13)", async () => {
    const { db, frames, roll: r } = await setup(2);
    const input = { rollId: r.id, frameIds: frames.map((f) => f.id), items: [{ type: "light_leak" as const }] };
    expect(await addMistakesToFramesCore(writesOnlyInTransaction(db), USER, input)).toEqual({ ok: true });
    expect(await live(db)).toHaveLength(2);
    expect((await db.select({ v: roll.version }).from(roll).where(eq(roll.id, r.id)))[0].v).toBe(2);
  });

  it("a concurrent save adding the same type between the read and the insert doesn't throw", async () => {
    const { db, frames, roll: r } = await setup(2);
    const racing = raceInTransaction(db, "afterFirstSelect", async (tx) => {
      await tx.insert(mistake).values({ userId: USER, rollId: r.id, frameId: frames[0].id, type: "light_leak" });
    });
    const input = { rollId: r.id, frameIds: frames.map((f) => f.id), items: [{ type: "light_leak" as const }] };
    expect(await addMistakesToFramesCore(racing, USER, input)).toEqual({ ok: true });
    const rows = await live(db);
    expect(rows.map((m) => m.frameId).sort()).toEqual(frames.map((f) => f.id).sort()); // one light_leak per frame
  });

  it("is idempotent: running it twice adds no duplicate rows", async () => {
    const { db, frames, roll: r } = await setup(2);
    const input = { rollId: r.id, frameIds: frames.map((f) => f.id), items: [{ type: "light_leak" as const }] };
    await addMistakesToFramesCore(db, USER, input);
    await addMistakesToFramesCore(db, USER, input);
    const rows = await db.select().from(mistake).where(and(eq(mistake.rollId, r.id), isNull(mistake.deletedAt)));
    expect(rows).toHaveLength(2);
  });

  it("refuses no types, an unknown type, or a frame from another roll, without writing", async () => {
    const { db, frames, roll: r } = await setup(1);
    const other = await seedRollWithFrames(db, USER, 1);
    expect(await addMistakesToFramesCore(db, USER, { rollId: r.id, frameIds: [frames[0].id], items: [] })).toEqual({ ok: false, error: "invalid_input" });
    expect(
      await addMistakesToFramesCore(db, USER, { rollId: r.id, frameIds: [frames[0].id], items: [{ type: "blinked" as never }] }),
    ).toEqual({ ok: false, error: "invalid_input" });
    expect(
      await addMistakesToFramesCore(db, USER, { rollId: r.id, frameIds: [other.frames[0].id], items: [{ type: "light_leak" }] }),
    ).toEqual({ ok: false, error: "not_found" });
    expect(await db.select().from(mistake)).toHaveLength(0);
    expect((await db.select({ v: roll.version }).from(roll).where(eq(roll.id, r.id)))[0].v).toBe(1);
  });

  it("duplicate frame ids are harmless and the version bumps once", async () => {
    const { db, frames, roll: r } = await setup(1);
    const id = frames[0].id;
    await addMistakesToFramesCore(db, USER, { rollId: r.id, frameIds: [id, id], items: [{ type: "light_leak" }] });
    expect(await live(db)).toHaveLength(1);
    expect((await db.select({ v: roll.version }).from(roll).where(eq(roll.id, r.id)))[0].v).toBe(2);
  });
});
