import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { note, roll } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { seedRollWithFrames } from "@/test/phase2-fixtures";
import { deleteNoteCore, listRollNotesCore, saveMemoryCore, saveNoteCore } from "./core";

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

describe("saveNoteCore (NOTE-1, D6)", () => {
  it("creates a roll note, then edits it in place", async () => {
    const { db, roll: r } = await setup();
    const created = await saveNoteCore(db, USER, { rollId: r.id, body: "đi Đà Lạt" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const edited = await saveNoteCore(db, USER, { noteId: created.id, rollId: r.id, body: "đi Đà Lạt với Minh" });
    expect(edited).toMatchObject({ ok: true, id: created.id });
    const rows = await db.select().from(note);
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe("đi Đà Lạt với Minh");
  });

  it("attaches a note to one of the roll's frames, and refuses a frame from elsewhere", async () => {
    const { db, roll: r, frames } = await setup();
    expect((await saveNoteCore(db, USER, { rollId: r.id, frameId: frames[0].id, body: "lọt sáng" })).ok).toBe(true);
    const other = await seedRollWithFrames(db, USER, 1);
    expect(await saveNoteCore(db, USER, { rollId: r.id, frameId: other.frames[0].id, body: "x" })).toEqual({
      ok: false,
      error: "not_found",
    });
  });

  it("soft-deletes the note when saved empty", async () => {
    const { db, roll: r } = await setup();
    const created = await saveNoteCore(db, USER, { rollId: r.id, body: "tạm" });
    if (!created.ok) throw new Error();
    await saveNoteCore(db, USER, { noteId: created.id, rollId: r.id, body: "   " });
    const [row] = await db.select().from(note).where(eq(note.id, created.id));
    expect(row.deletedAt).not.toBeNull();
  });

  it("refuses another user's roll or note, and leaves roll.version alone", async () => {
    const { db, roll: r } = await setup();
    expect(await saveNoteCore(db, OTHER, { rollId: r.id, body: "x" })).toEqual({ ok: false, error: "not_found" });
    const created = await saveNoteCore(db, USER, { rollId: r.id, body: "của tôi" });
    if (!created.ok) throw new Error();
    expect(await deleteNoteCore(db, OTHER, { noteId: created.id })).toEqual({ ok: false, error: "not_found" });
    const [row] = await db.select().from(roll).where(eq(roll.id, r.id));
    expect(row.version).toBe(1);
  });
});

describe("saveMemoryCore (NOTE-1)", () => {
  it("saves the memory and bumps roll.version (D19)", async () => {
    const { db, roll: r } = await setup();
    const result = await saveMemoryCore(db, USER, { rollId: r.id, memory: "Tết ở quê, trời mưa" });
    expect(result.ok).toBe(true);
    const [row] = await db.select().from(roll).where(eq(roll.id, r.id));
    expect(row.memory).toBe("Tết ở quê, trời mưa");
    expect(row.version).toBe(2);
    expect(await saveMemoryCore(db, OTHER, { rollId: r.id, memory: "x" })).toEqual({ ok: false, error: "not_found" });
  });
});

describe("listRollNotesCore", () => {
  it("lists live notes newest first, with the frame's position for frame notes", async () => {
    const { db, roll: r, frames } = await setup();
    const a = await saveNoteCore(db, USER, { rollId: r.id, body: "đầu tiên" });
    await new Promise((res) => setTimeout(res, 5));
    const b = await saveNoteCore(db, USER, { rollId: r.id, frameId: frames[1].id, body: "tấm 2" });
    if (!a.ok || !b.ok) throw new Error();
    const list = await listRollNotesCore(db, USER, r.id);
    expect(list.map((n) => [n.id, n.framePosition])).toEqual([
      [b.id, 2],
      [a.id, null],
    ]);
    expect(await listRollNotesCore(db, OTHER, r.id)).toEqual([]);
  });
});
