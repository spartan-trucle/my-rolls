import "server-only";

import { and, eq, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";
import { lab, labBranch } from "@/db/schema";
import type { TDb } from "@/db/types";
import { toSearchText } from "@/lib/search-text";
import { HOME_DEVELOPMENT_SLUG, LAB_SERVICES } from "./constants";

/**
 * `core.ts` holds every plain `(db, userId, input)` function for LAB-1/
 * LAB-2 — the shape `actions.test.ts` and `core.test.ts` (PGlite, D21)
 * call directly — plus the zod schema and DB-touching helpers they share.
 * `actions.ts` only re-exports thin `"use server"` wrappers around these;
 * Next rejects a per-function `"use server"` in a module a client
 * component (F2's lab picker) imports, and mixing the two would pull this
 * DB code into the client bundle graph. `import "server-only"` still
 * guards this file itself from ever being imported by client code
 * directly; Vitest aliases it to an empty module (`vitest.config.mts`),
 * same as `src/lib/auth.ts`.
 */

export type TLabRow = typeof lab.$inferSelect;
export type TLabBranchRow = typeof labBranch.$inferSelect;

export interface ILabWithBranches extends TLabRow {
  branches: TLabBranchRow[];
}

export interface ISearchLabsInput {
  q?: string;
  city?: string;
  /** The signed-in caller, or `null` for a visitor — never another user's id. */
  userId: string | null;
  limit?: number;
}

const DEFAULT_LIMIT = 30;

/**
 * B5, LAB-1/LAB-2: seeded labs (`owner_id IS NULL`) plus the caller's own
 * private ones, each with its live branches, soft-deleted rows excluded,
 * another user's private lab never returned (D9: every query filters by
 * owner, since there are no foreign keys or row-level security).
 *
 * `q` and `city` are matched in application code against the
 * `search_text` columns B2's `toSearchText()` already filled on write,
 * rather than pushed down as a second SQL predicate: the seeded directory
 * is a curated ~30 rows (D11), and matching here — after one owner-scoped
 * fetch — is what lets a lab that matches only through one of several
 * sibling branches still come back with *all* its live branches attached,
 * which a per-row SQL predicate across two tables with no foreign key
 * between them can't express as cleanly. `toSearchText()` (D8) is reused
 * on both sides so a query normalises the same way the data was written.
 *
 * The built-in "Tự tráng ở nhà" (`home-development`, LAB-1) is fetched
 * separately and always pinned first — city and q never exclude it, since
 * it has no branch and no city of its own.
 */
export async function searchLabs(
  db: TDb,
  { q, city, userId, limit = DEFAULT_LIMIT }: ISearchLabsInput,
): Promise<ILabWithBranches[]> {
  const ownerCondition = userId
    ? or(isNull(lab.ownerId), eq(lab.ownerId, userId))
    : isNull(lab.ownerId);

  const rows = await db
    .select({ lab, branch: labBranch })
    .from(lab)
    .leftJoin(
      labBranch,
      and(eq(labBranch.labId, lab.id), isNull(labBranch.deletedAt)),
    )
    .where(
      and(
        isNull(lab.deletedAt),
        ownerCondition,
        // `slug` is null for every private lab (D9 catalogue.ts pattern),
        // and `NULL != 'home-development'` is NULL, not true, in SQL — so
        // this has to allow a null slug through, not just compare it.
        or(isNull(lab.slug), ne(lab.slug, HOME_DEVELOPMENT_SLUG)),
      ),
    );

  const byId = new Map<string, ILabWithBranches>();
  for (const row of rows) {
    const existing = byId.get(row.lab.id) ?? { ...row.lab, branches: [] };
    if (row.branch) existing.branches.push(row.branch);
    byId.set(row.lab.id, existing);
  }

  let labs = [...byId.values()];

  const qNeedle = q?.trim() ? toSearchText(q) : undefined;
  if (qNeedle) {
    labs = labs.filter(
      (item) =>
        item.searchText?.includes(qNeedle) ||
        item.branches.some((branch) => branch.searchText?.includes(qNeedle)),
    );
  }

  const cityNeedle = city?.trim() ? toSearchText(city) : undefined;
  if (cityNeedle) {
    labs = labs.filter((item) =>
      item.branches.some((branch) => toSearchText(branch.city) === cityNeedle),
    );
  }

  labs.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const homeDevelopment = await getHomeDevelopmentLab(db);
  const limited = labs.slice(0, limit);

  return homeDevelopment ? [homeDevelopment, ...limited] : limited;
}

async function getHomeDevelopmentLab(
  db: TDb,
): Promise<ILabWithBranches | null> {
  const rows = await db
    .select()
    .from(lab)
    .where(and(eq(lab.slug, HOME_DEVELOPMENT_SLUG), isNull(lab.deletedAt)))
    .limit(1);

  const row = rows[0];
  return row ? { ...row, branches: [] } : null;
}

/**
 * B5: distinct cities of live seeded branches, for the city chips
 * (LAB-1). Seeded only (`owner_id IS NULL` on the parent lab) — a
 * private custom lab's city never shows as a shared chip. The
 * home-development lab has no branch, so it's naturally absent here.
 */
export async function listLabCities(db: TDb): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: labBranch.city })
    .from(labBranch)
    .innerJoin(lab, eq(lab.id, labBranch.labId))
    .where(
      and(
        isNull(labBranch.deletedAt),
        isNull(lab.deletedAt),
        isNull(lab.ownerId),
      ),
    );

  return rows.map((row) => row.city).sort((a, b) => a.localeCompare(b, "vi"));
}

/**
 * LAB-2's add-lab form: name is the only thing that must be filled in.
 * `city` is also required here even though the form copy doesn't call it
 * out specially — `lab_branch.city` is `NOT NULL` (D5, migration 0002),
 * so accepting an empty city would only turn into an opaque DB error
 * instead of a field-level one. The "Gửi lên danh bạ lab chung" toggle
 * (design finding 2, CAT-3) isn't part of this schema: every lab this
 * action creates is private (LAB-2).
 */
const addLabSchema = z.object({
  name: z.string().trim().min(1, "name_required"),
  city: z.string().trim().min(1, "city_required"),
  address: z
    .string()
    .trim()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  linkUrl: z
    .httpUrl("invalid_link_url")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  services: z.array(z.enum(LAB_SERVICES)).optional(),
  acceptsMail: z.boolean().optional(),
  district: z
    .string()
    .trim()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  areaHint: z
    .string()
    .trim()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type TAddLabInput = z.input<typeof addLabSchema>;

export type TAddLabError =
  | { type: "unauthenticated" }
  | { type: "validation"; issues: { path: string; message: string }[] };

export type TAddLabResult =
  | { ok: true; lab: TLabRow; branch: TLabBranchRow }
  | { ok: false; error: TAddLabError };

/**
 * The DB work only, no validation: one private `lab` plus one
 * `lab_branch`, in a single transaction, `search_text` filled on both
 * (D8, D12). Exported (not just called from `addLabCore`) so
 * `core.test.ts` can drive it directly with a deliberately invalid `city`
 * and prove the lab row doesn't survive the branch insert failing —
 * every real caller goes through `addLabCore`'s zod schema instead, which
 * never lets an invalid `city` reach this far.
 */
export async function createLabAndBranch(
  db: TDb,
  userId: string,
  data: z.output<typeof addLabSchema>,
): Promise<{ lab: TLabRow; branch: TLabBranchRow }> {
  return db.transaction(async (tx) => {
    const [insertedLab] = await tx
      .insert(lab)
      .values({
        ownerId: userId,
        name: data.name,
        address: data.address ?? null,
        linkUrl: data.linkUrl ?? null,
        services: data.services ?? null,
        acceptsMail: data.acceptsMail ?? null,
        searchText: toSearchText(data.name),
      })
      .returning();

    if (!insertedLab)
      throw new Error("createLabAndBranch: lab insert returned no row");

    const [insertedBranch] = await tx
      .insert(labBranch)
      .values({
        labId: insertedLab.id,
        city: data.city,
        district: data.district ?? null,
        areaHint: data.areaHint ?? null,
        address: data.address ?? null,
        linkUrl: data.linkUrl ?? null,
        services: data.services ?? null,
        acceptsMail: data.acceptsMail ?? null,
        searchText: toSearchText(
          [data.name, data.city, data.district, data.areaHint]
            .filter(Boolean)
            .join(" "),
        ),
      })
      .returning();

    if (!insertedBranch)
      throw new Error("createLabAndBranch: lab_branch insert returned no row");

    return { lab: insertedLab, branch: insertedBranch };
  });
}

/**
 * B5, LAB-2: validates the form, then delegates to `createLabAndBranch`.
 * Takes `db` and `userId` directly (not `getDb()`/a session) so
 * `core.test.ts` runs it against PGlite with no Next request context
 * (D21) — `actions.ts`'s `"use server"` wrapper is the only thing that
 * reads `headers()` and the pooled db.
 */
export async function addLabCore(
  db: TDb,
  userId: string | null,
  input: unknown,
): Promise<TAddLabResult> {
  if (!userId) return { ok: false, error: { type: "unauthenticated" } };

  const parsed = addLabSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        type: "validation",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }

  const { lab: insertedLab, branch } = await createLabAndBranch(
    db,
    userId,
    parsed.data,
  );
  return { ok: true, lab: insertedLab, branch };
}
