import { randomUUID } from "node:crypto";
import { eq, getTableColumns, getTableName } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db/test-db";
import vi from "../../../messages/vi.json";
import { MISTAKE_TYPES, mistake, note } from "./notes";

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

async function freshDb() {
  const { db, client } = await createTestDb();
  cleanup = () => client.close();
  return db;
}

describe("note schema", () => {
  it("names the table note and lets frame_id be null for a roll note (D6)", () => {
    expect(getTableName(note)).toBe("note");
    const columns = getTableColumns(note);
    expect(columns.rollId.notNull).toBe(true);
    expect(columns.frameId.notNull).toBe(false);
    expect(columns.body.notNull).toBe(true);
    expect(columns.updatedAt.notNull).toBe(true);
  });
});

describe("mistake schema", () => {
  it("has the 13 NOTE-2 types in order, as English slugs (D4)", () => {
    expect(MISTAKE_TYPES).toEqual([
      "light_leak",
      "blank_frame",
      "double_exposure",
      "missed_focus",
      "underexposed",
      "overexposed",
      "wrong_iso",
      "camera_shake",
      "opened_back",
      "rewound_early",
      "lab_dust_scratches",
      "lab_colour_cast",
      "other",
    ]);
  });

  it("has a Vietnamese label for every type", () => {
    const labels = (vi as { mistakes?: { types?: Record<string, string> } }).mistakes?.types ?? {};
    for (const type of MISTAKE_TYPES) {
      expect(labels[type], type).toBeTruthy();
    }
  });

  it("keeps an optional note and a nullable frame_id (D4)", () => {
    const columns = getTableColumns(mistake);
    expect(getTableName(mistake)).toBe("mistake");
    expect(columns.note.notNull).toBe(false);
    expect(columns.frameId.notNull).toBe(false);
    expect(columns.type.notNull).toBe(true);
  });

  it("rejects a second live row of the same type on the same frame", async () => {
    const db = await freshDb();
    const values = { userId: "u1", rollId: randomUUID(), frameId: randomUUID(), type: "light_leak" as const };
    await db.insert(mistake).values(values);
    await expect(db.insert(mistake).values(values)).rejects.toThrow();
  });

  it("rejects a duplicate roll-level type too, where frame_id is null (NULLS NOT DISTINCT)", async () => {
    const db = await freshDb();
    const values = { userId: "u1", rollId: randomUUID(), frameId: null, type: "wrong_iso" as const };
    await db.insert(mistake).values(values);
    await expect(db.insert(mistake).values(values)).rejects.toThrow();
  });

  it("allows the type again once the first row is soft-deleted", async () => {
    const db = await freshDb();
    const values = { userId: "u1", rollId: randomUUID(), frameId: null, type: "other" as const };
    const [first] = await db.insert(mistake).values(values).returning();
    await db.update(mistake).set({ deletedAt: new Date() }).where(eq(mistake.id, first.id));
    await expect(db.insert(mistake).values(values)).resolves.toBeDefined();
  });
});
