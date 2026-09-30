import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { lab, labBranch, roll, scanSet } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { getScanSetForRollCore, updateScanSetCore } from "./core";

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
  const [r] = await db.insert(roll).values({ userId: USER, stockId: randomUUID(), cameraBagItemId: randomUUID() }).returning();
  const [set] = await db.insert(scanSet).values({ userId: USER, rollId: r.id }).returning();
  const [seeded] = await db.insert(lab).values({ name: "LLAB", slug: "llab" }).returning();
  const [seededBranch] = await db.insert(labBranch).values({ labId: seeded.id, name: "Q.3", city: "TP.HCM" }).returning();
  const [home] = await db.insert(lab).values({ name: "Tự tráng ở nhà", slug: "home-development" }).returning();
  const [mine] = await db.insert(lab).values({ name: "Lab nhà mình", ownerId: USER }).returning();
  const [theirs] = await db.insert(lab).values({ name: "Lab của người khác", ownerId: OTHER }).returning();
  const [theirsBranch] = await db.insert(labBranch).values({ labId: theirs.id, city: "Hà Nội" }).returning();
  return { db, rollId: r.id, scanSetId: set.id, seeded, seededBranch, home, mine, theirs, theirsBranch };
}

describe("updateScanSetCore (LAB-3, D7)", () => {
  it("is not_found for another user's scan set", async () => {
    const { db, scanSetId, seeded } = await setup();
    expect(await updateScanSetCore(db, OTHER, { scanSetId, labId: seeded.id })).toEqual({ ok: false, error: "not_found" });
  });

  it("takes a seeded lab and branch, or the user's own lab", async () => {
    const { db, scanSetId, seeded, seededBranch, mine } = await setup();
    expect(await updateScanSetCore(db, USER, { scanSetId, labId: seeded.id, labBranchId: seededBranch.id })).toEqual({ ok: true });
    expect(await updateScanSetCore(db, USER, { scanSetId, labId: mine.id, labBranchId: null })).toEqual({ ok: true });
    const [row] = await db.select().from(scanSet).where(eq(scanSet.id, scanSetId));
    expect(row.labId).toBe(mine.id);
    expect(row.labBranchId).toBeNull();
  });

  it("takes home development with no branch", async () => {
    const { db, scanSetId, home } = await setup();
    expect(await updateScanSetCore(db, USER, { scanSetId, labId: home.id, labBranchId: null })).toEqual({ ok: true });
  });

  it("refuses another user's private lab, and a branch of a different lab", async () => {
    const { db, scanSetId, theirs, seeded, theirsBranch } = await setup();
    expect(await updateScanSetCore(db, USER, { scanSetId, labId: theirs.id })).toEqual({ ok: false, error: "invalid_lab" });
    expect(await updateScanSetCore(db, USER, { scanSetId, labId: seeded.id, labBranchId: theirsBranch.id })).toEqual({
      ok: false,
      error: "invalid_lab",
    });
  });

  it("refuses a received date in the future, and a drop-off after the receipt", async () => {
    const { db, scanSetId } = await setup();
    const tomorrow = new Date(Date.now() + 86_400_000);
    expect(await updateScanSetCore(db, USER, { scanSetId, receivedAt: tomorrow })).toEqual({ ok: false, error: "invalid_dates" });
    expect(
      await updateScanSetCore(db, USER, {
        scanSetId,
        receivedAt: new Date("2026-11-10"),
        droppedAt: new Date("2026-11-12"),
      }),
    ).toEqual({ ok: false, error: "invalid_dates" });
  });

  it("refuses push/pull beyond ±3 stops", async () => {
    const { db, scanSetId } = await setup();
    expect(await updateScanSetCore(db, USER, { scanSetId, pushPullThirds: 10 })).toEqual({ ok: false, error: "invalid_push_pull" });
    expect(await updateScanSetCore(db, USER, { scanSetId, pushPullThirds: -9 })).toEqual({ ok: true });
  });

  it("stores the optional details", async () => {
    const { db, scanSetId } = await setup();
    await updateScanSetCore(db, USER, {
      scanSetId,
      process: "c41",
      scanner: "Noritsu HS-1800",
      resolutionPx: 3024,
      fileFormat: "JPEG",
      priceVnd: 80_000,
    });
    const [row] = await db.select().from(scanSet).where(eq(scanSet.id, scanSetId));
    expect(row).toMatchObject({ process: "c41", scanner: "Noritsu HS-1800", resolutionPx: 3024, fileFormat: "JPEG", priceVnd: 80_000 });
  });
});

describe("getScanSetForRollCore", () => {
  it("returns the set with lab and branch names, owner-scoped", async () => {
    const { db, rollId, scanSetId, seeded, seededBranch } = await setup();
    await updateScanSetCore(db, USER, { scanSetId, labId: seeded.id, labBranchId: seededBranch.id });
    expect(await getScanSetForRollCore(db, USER, rollId)).toMatchObject({
      id: scanSetId,
      labId: seeded.id,
      labName: "LLAB",
      branchName: "Q.3",
      branchCity: "TP.HCM",
    });
    expect(await getScanSetForRollCore(db, OTHER, rollId)).toBeNull();
  });

  it("names home development, which has no branch", async () => {
    const { db, rollId, scanSetId, home } = await setup();
    await updateScanSetCore(db, USER, { scanSetId, labId: home.id, labBranchId: null });
    expect(await getScanSetForRollCore(db, USER, rollId)).toMatchObject({ labName: "Tự tráng ở nhà", branchName: null });
  });

  it("is null for a roll with no scans yet", async () => {
    const { db } = await setup();
    const [bare] = await db.insert(roll).values({ userId: USER, stockId: randomUUID(), cameraBagItemId: randomUUID() }).returning();
    expect(await getScanSetForRollCore(db, USER, bare.id)).toBeNull();
  });
});
