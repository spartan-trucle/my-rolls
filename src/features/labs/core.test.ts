import { and, eq, isNull } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { lab, labBranch } from "@/db/schema";
import { createTestDb, type TTestDb } from "@/db/test-db";
import { toSearchText } from "@/lib/search-text";
import { HOME_DEVELOPMENT_SLUG } from "./constants";
import {
  addLabCore,
  createLabAndBranch,
  listLabCities,
  searchLabs,
  type TAddLabInput,
} from "./core";

const OWNER_A = "user-a";
const OWNER_B = "user-b";

/**
 * Inserts a seeded lab (`owner_id IS NULL`) with one branch, filling
 * `search_text` the same way B2's real write path would.
 */
async function insertSeededLab(
  db: TTestDb,
  input: { slug: string; name: string; city: string; district?: string },
) {
  const [insertedLab] = await db
    .insert(lab)
    .values({
      slug: input.slug,
      name: input.name,
      searchText: toSearchText(input.name),
    })
    .returning();
  if (!insertedLab)
    throw new Error("insertSeededLab: lab insert returned no row");

  await db.insert(labBranch).values({
    labId: insertedLab.id,
    city: input.city,
    district: input.district,
    searchText: toSearchText(`${input.name} ${input.city}`),
  });

  return insertedLab;
}

async function insertPrivateLab(
  db: TTestDb,
  input: { ownerId: string; name: string; city: string },
) {
  const [insertedLab] = await db
    .insert(lab)
    .values({
      ownerId: input.ownerId,
      name: input.name,
      searchText: toSearchText(input.name),
    })
    .returning();
  if (!insertedLab)
    throw new Error("insertPrivateLab: lab insert returned no row");

  await db.insert(labBranch).values({
    labId: insertedLab.id,
    city: input.city,
    searchText: toSearchText(`${input.name} ${input.city}`),
  });

  return insertedLab;
}

async function insertHomeDevelopmentLab(db: TTestDb) {
  await db.insert(lab).values({
    slug: HOME_DEVELOPMENT_SLUG,
    name: "Tự tráng ở nhà",
    searchText: toSearchText("Tự tráng ở nhà"),
  });
}

describe("searchLabs (B5, LAB-1, LAB-2)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("matches a Vietnamese city typed without accents (q against lab/branch search_text)", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertSeededLab(db, {
      slug: "cinephile-da-lat",
      name: "Cinephile Film Lab",
      city: "Đà Lạt",
    });
    await insertSeededLab(db, { slug: "llab", name: "LLAB", city: "TP.HCM" });

    const results = await searchLabs(db, { q: "da lat", userId: null });

    expect(results.map((result) => result.name)).toContain(
      "Cinephile Film Lab",
    );
    expect(results.map((result) => result.name)).not.toContain("LLAB");
  });

  it("filters by city, compared accent-free ('da nang' matches 'Đà Nẵng')", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertSeededLab(db, {
      slug: "in-da-nang",
      name: "Croplab",
      city: "Đà Nẵng",
    });
    await insertSeededLab(db, { slug: "in-hcm", name: "LLAB", city: "TP.HCM" });

    const results = await searchLabs(db, { city: "da nang", userId: null });

    expect(results.map((result) => result.name)).toEqual(
      expect.arrayContaining(["Croplab"]),
    );
    expect(results.map((result) => result.name)).not.toContain("LLAB");
  });

  it("always includes the home-development lab, regardless of city, and pins it first", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertHomeDevelopmentLab(db);
    await insertSeededLab(db, {
      slug: "in-da-nang",
      name: "Croplab",
      city: "Đà Nẵng",
    });

    const results = await searchLabs(db, { city: "da nang", userId: null });

    expect(results[0]?.slug).toBe(HOME_DEVELOPMENT_SLUG);
    expect(
      results.some((result) => result.slug === HOME_DEVELOPMENT_SLUG),
    ).toBe(true);
  });

  it("empty q and no city: every lab, alphabetical, home-development pinned first", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertHomeDevelopmentLab(db);
    await insertSeededLab(db, {
      slug: "z-lab",
      name: "Zzz Lab",
      city: "TP.HCM",
    });
    await insertSeededLab(db, {
      slug: "a-lab",
      name: "Anh Lab",
      city: "TP.HCM",
    });

    const results = await searchLabs(db, { userId: null });

    expect(results.map((result) => result.name)).toEqual([
      "Tự tráng ở nhà",
      "Anh Lab",
      "Zzz Lab",
    ]);
  });

  it("returns each lab with its live branches, excluding soft-deleted branches", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const insertedLab = await insertSeededLab(db, {
      slug: "multi-branch",
      name: "Multi Lab",
      city: "TP.HCM",
    });
    await db.insert(labBranch).values({
      labId: insertedLab.id,
      city: "Hà Nội",
      searchText: toSearchText("Multi Lab Hà Nội"),
      deletedAt: new Date(),
    });

    const results = await searchLabs(db, { userId: null });
    const found = results.find((result) => result.slug === "multi-branch");

    expect(found?.branches).toHaveLength(1);
    expect(found?.branches[0]?.city).toBe("TP.HCM");
  });

  it("excludes soft-deleted labs entirely", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const insertedLab = await insertSeededLab(db, {
      slug: "gone-lab",
      name: "Gone Lab",
      city: "TP.HCM",
    });
    await db
      .update(lab)
      .set({ deletedAt: new Date() })
      .where(eq(lab.id, insertedLab.id));

    const results = await searchLabs(db, { userId: null });

    expect(results.map((result) => result.name)).not.toContain("Gone Lab");
  });

  it("includes the caller's own private lab", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertPrivateLab(db, {
      ownerId: OWNER_A,
      name: "My Home Setup",
      city: "TP.HCM",
    });

    const results = await searchLabs(db, { userId: OWNER_A });

    expect(results.map((result) => result.name)).toContain("My Home Setup");
  });

  it("never returns another user's private lab", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertPrivateLab(db, {
      ownerId: OWNER_A,
      name: "Owner A's Lab",
      city: "TP.HCM",
    });

    const results = await searchLabs(db, { userId: OWNER_B });

    expect(results.map((result) => result.name)).not.toContain("Owner A's Lab");
  });
});

describe("listLabCities (B5)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("returns distinct cities of live seeded branches only", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await insertSeededLab(db, { slug: "llab", name: "LLAB", city: "TP.HCM" });
    await insertSeededLab(db, {
      slug: "llab-2",
      name: "LLAB 2",
      city: "TP.HCM",
    });
    await insertSeededLab(db, {
      slug: "croplab",
      name: "Croplab",
      city: "Đà Nẵng",
    });
    await insertPrivateLab(db, {
      ownerId: OWNER_A,
      name: "Private Lab",
      city: "Hà Nội",
    });

    const cities = await listLabCities(db);

    expect(cities).toEqual(["Đà Nẵng", "TP.HCM"]);
  });
});

const OWNER = "user-a";

const VALID_INPUT: TAddLabInput = {
  name: "My Home Lab",
  city: "TP.HCM",
  address: "123 Main St",
  linkUrl: "https://facebook.com/my-home-lab",
  services: ["C-41", "B&W"],
  acceptsMail: true,
  district: "Bình Thạnh",
  areaHint: "Q.Bình Thạnh",
};

describe("addLabCore (B5, LAB-2)", () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await cleanup?.();
    cleanup = undefined;
  });

  it("creates a private lab and one branch in a single transaction, search_text set on both", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addLabCore(db, OWNER, VALID_INPUT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.lab.ownerId).toBe(OWNER);
    expect(result.lab.name).toBe("My Home Lab");
    expect(result.lab.searchText).toContain("my home lab");
    expect(result.branch.labId).toBe(result.lab.id);
    expect(result.branch.city).toBe("TP.HCM");
    expect(result.branch.searchText).toBeTruthy();

    const labs = await db.select().from(lab).where(eq(lab.id, result.lab.id));
    expect(labs).toHaveLength(1);
  });

  it("is private to the owner — only that user's search sees it", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    await addLabCore(db, OWNER, VALID_INPUT);

    const rows = await db
      .select()
      .from(lab)
      .where(and(eq(lab.ownerId, OWNER), isNull(lab.deletedAt)));

    expect(rows).toHaveLength(1);
  });

  it("returns a typed unauthenticated error and writes nothing when there is no user", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addLabCore(db, null, VALID_INPUT);

    expect(result).toEqual({ ok: false, error: { type: "unauthenticated" } });

    const labs = await db.select().from(lab);
    expect(labs).toHaveLength(0);
  });

  it("rejects an invalid link URL", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addLabCore(db, OWNER, {
      ...VALID_INPUT,
      linkUrl: "not-a-url",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("validation");
  });

  it("accepts no link URL at all", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const withoutLink: TAddLabInput = { ...VALID_INPUT };
    delete withoutLink.linkUrl;
    const result = await addLabCore(db, OWNER, withoutLink);

    expect(result.ok).toBe(true);
  });

  it("rejects an unknown service", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addLabCore(db, OWNER, {
      ...VALID_INPUT,
      services: ["slide" as never],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("validation");
  });

  it("rejects an empty name", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    const result = await addLabCore(db, OWNER, { ...VALID_INPUT, name: "  " });

    expect(result.ok).toBe(false);
  });

  it("rolls back the lab insert if the branch insert fails", async () => {
    const { db, client } = await createTestDb();
    cleanup = () => client.close();

    // Bypasses zod on purpose (city required by `lab_branch`'s NOT NULL
    // column, D5) to force a DB-level failure on the second insert and
    // prove the first insert (the lab row) doesn't survive it.
    const broken = { ...VALID_INPUT, city: undefined as unknown as string };

    await expect(createLabAndBranch(db, OWNER, broken)).rejects.toThrow();

    const labs = await db.select().from(lab).where(eq(lab.ownerId, OWNER));
    expect(labs).toHaveLength(0);
  });
});
