import { and, eq, isNull } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { mistake, roll } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { seedRollWithFrames } from "@/test/phase2-fixtures";
import { listRollMistakesCore, setMistakesCore } from "./core";

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
  return { db, ...(await seedRollWithFrames(db, USER, 2)) };
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
