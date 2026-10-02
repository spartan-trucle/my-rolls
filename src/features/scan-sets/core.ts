import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { SCAN_PROCESSES, lab, labBranch, scanSet } from "@/db/schema";
import type { TDb } from "@/features/shared/db";

/** D8: ±3 stops in thirds. */
const MAX_PUSH_PULL_THIRDS = 9;

export const updateScanSetInputSchema = z.object({
  scanSetId: z.uuid(),
  labId: z.uuid().nullable().optional(),
  labBranchId: z.uuid().nullable().optional(),
  receivedAt: z.date().nullable().optional(),
  droppedAt: z.date().nullable().optional(),
  process: z.enum(SCAN_PROCESSES).nullable().optional(),
  pushPullThirds: z.number().int().nullable().optional(),
  scanner: z.string().trim().max(120).nullable().optional(),
  resolutionPx: z.number().int().positive().max(100_000).nullable().optional(),
  fileFormat: z.string().trim().max(40).nullable().optional(),
  priceVnd: z.number().int().min(0).max(100_000_000).nullable().optional(),
});

export type TUpdateScanSetInput = z.infer<typeof updateScanSetInputSchema>;
export type TUpdateScanSetResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "invalid_lab" | "invalid_dates" | "invalid_push_pull" | "invalid_input" };

/** A lab the caller may pick: seeded (no owner) or their own private one, and live. */
async function labIsPickable<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  labId: string,
  labBranchId: string | null | undefined,
): Promise<boolean> {
  const [found] = await db
    .select({ id: lab.id })
    .from(lab)
    .where(and(eq(lab.id, labId), isNull(lab.deletedAt), or(isNull(lab.ownerId), eq(lab.ownerId, userId))))
    .limit(1);
  if (!found) return false;
  if (!labBranchId) return true;
  const [branch] = await db
    .select({ id: labBranch.id })
    .from(labBranch)
    .where(and(eq(labBranch.id, labBranchId), eq(labBranch.labId, labId), isNull(labBranch.deletedAt)))
    .limit(1);
  return Boolean(branch);
}

/**
 * Phase 2 plan B4 (LAB-3, D7, D8): records the lab (and branch, when the lab has them) and the
 * optional details on the caller's scan set. Only fields present in `input` change. A branch
 * needs its lab in the same call, so the pair is always checked together.
 */
export async function updateScanSetCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  raw: TUpdateScanSetInput,
): Promise<TUpdateScanSetResult> {
  const parsed = updateScanSetInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const input = parsed.data;

  const [set] = await db
    .select()
    .from(scanSet)
    .where(and(eq(scanSet.id, input.scanSetId), eq(scanSet.userId, userId), isNull(scanSet.deletedAt)))
    .limit(1);
  if (!set) return { ok: false, error: "not_found" };

  if (input.labBranchId && !input.labId) return { ok: false, error: "invalid_lab" };
  if (input.labId && !(await labIsPickable(db, userId, input.labId, input.labBranchId))) {
    return { ok: false, error: "invalid_lab" };
  }

  const receivedAt = input.receivedAt === undefined ? set.receivedAt : input.receivedAt;
  const droppedAt = input.droppedAt === undefined ? set.droppedAt : input.droppedAt;
  if (receivedAt && receivedAt.getTime() > Date.now()) return { ok: false, error: "invalid_dates" };
  if (receivedAt && droppedAt && droppedAt.getTime() > receivedAt.getTime()) return { ok: false, error: "invalid_dates" };

  if (input.pushPullThirds != null && Math.abs(input.pushPullThirds) > MAX_PUSH_PULL_THIRDS) {
    return { ok: false, error: "invalid_push_pull" };
  }

  const values = Object.fromEntries(
    Object.entries(input).filter(([key, v]) => key !== "scanSetId" && v !== undefined),
  );
  if (input.labId !== undefined && input.labBranchId === undefined) values.labBranchId = null;

  await db
    .update(scanSet)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(scanSet.id, input.scanSetId), eq(scanSet.userId, userId)));

  return { ok: true };
}

export interface IScanSetSummary {
  id: string;
  labId: string | null;
  labBranchId: string | null;
  labName: string | null;
  branchName: string | null;
  branchCity: string | null;
  receivedAt: Date | null;
  droppedAt: Date | null;
  process: (typeof SCAN_PROCESSES)[number] | null;
  pushPullThirds: number | null;
  scanner: string | null;
  resolutionPx: number | null;
  fileFormat: string | null;
  priceVnd: number | null;
}

/** The roll's live scan set with its lab and branch names, for the roll page line; owner-scoped. */
export async function getScanSetForRollCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
): Promise<IScanSetSummary | null> {
  const [row] = await db
    .select({
      id: scanSet.id,
      labId: scanSet.labId,
      labBranchId: scanSet.labBranchId,
      labName: lab.name,
      branchName: labBranch.name,
      branchCity: labBranch.city,
      receivedAt: scanSet.receivedAt,
      droppedAt: scanSet.droppedAt,
      process: scanSet.process,
      pushPullThirds: scanSet.pushPullThirds,
      scanner: scanSet.scanner,
      resolutionPx: scanSet.resolutionPx,
      fileFormat: scanSet.fileFormat,
      priceVnd: scanSet.priceVnd,
    })
    .from(scanSet)
    .leftJoin(lab, eq(lab.id, scanSet.labId))
    .leftJoin(labBranch, eq(labBranch.id, scanSet.labBranchId))
    .where(and(eq(scanSet.rollId, rollId), eq(scanSet.userId, userId), isNull(scanSet.deletedAt)))
    .limit(1);
  return row ?? null;
}
