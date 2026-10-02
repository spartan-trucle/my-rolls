import { randomUUID } from "node:crypto";
import { eq, getTableColumns, getTableName } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/db/test-db";
import { roll } from "./rolls";
import { FRAME_STATUSES, frame, scanSet } from "./scans";

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

describe("scan_set schema", () => {
  it("names the table scan_set and keeps every LAB-3 detail optional (D7)", () => {
    expect(getTableName(scanSet)).toBe("scan_set");
    const columns = getTableColumns(scanSet);
    expect(columns.rollId.notNull).toBe(true);
    expect(columns.userId.notNull).toBe(true);
    for (const name of [
      "labId",
      "labBranchId",
      "receivedAt",
      "droppedAt",
      "process",
      "pushPullThirds",
      "scanner",
      "resolutionPx",
      "fileFormat",
      "priceVnd",
    ] as const) {
      expect(columns[name].notNull, name).toBe(false);
    }
    expect("references" in columns.labId).toBe(false);
  });

  it("allows one live scan set per roll, and another once the first is soft-deleted (D7)", async () => {
    const db = await freshDb();
    const rollId = randomUUID();
    const [first] = await db.insert(scanSet).values({ userId: "u1", rollId }).returning();
    await expect(db.insert(scanSet).values({ userId: "u1", rollId })).rejects.toThrow();
    await db.update(scanSet).set({ deletedAt: new Date() }).where(eq(scanSet.id, first.id));
    await expect(db.insert(scanSet).values({ userId: "u1", rollId })).resolves.toBeDefined();
  });

  it("takes a lab with no branch, as home development has none (D7)", async () => {
    const db = await freshDb();
    const [row] = await db
      .insert(scanSet)
      .values({ userId: "u1", rollId: randomUUID(), labId: randomUUID(), labBranchId: null })
      .returning();
    expect(row.labBranchId).toBeNull();
    expect(row.labId).not.toBeNull();
  });
});

describe("frame schema", () => {
  it("defaults a new frame to pending, not tấm ưng and not blank (D2, D3)", async () => {
    const db = await freshDb();
    const [row] = await db
      .insert(frame)
      .values({
        userId: "u1",
        rollId: randomUUID(),
        scanSetId: randomUUID(),
        position: 1,
        fileName: "01.jpg",
        contentType: "image/jpeg",
        bytes: 1024,
        originalKey: "originals/u1/x.jpg",
        gridKey: "grid/a.webp",
        viewKey: "view/b.webp",
      })
      .returning();
    expect(row.status).toBe("pending");
    expect(row.isKeeper).toBe(false);
    expect(row.isBlank).toBe(false);
  });

  it("has the two statuses and no single mark or note column (D2, D3, D6)", () => {
    expect(FRAME_STATUSES).toEqual(["pending", "ready"]);
    const names = Object.keys(getTableColumns(frame));
    expect(names).not.toContain("mark");
    expect(names).not.toContain("note");
    expect(names).toEqual(expect.arrayContaining(["sha256", "exif", "altText", "width", "height"]));
  });
});

describe("roll schema after 0004", () => {
  it("no longer has a notes column; notes live in the note table (D6)", () => {
    expect(Object.keys(getTableColumns(roll))).not.toContain("notes");
    expect(Object.keys(getTableColumns(roll))).toContain("memory");
  });
});
