"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { getAuth } from "@/lib/auth";
import { captureServerEvent } from "@/lib/posthog-server";
import {
  getScanSetForRollCore,
  updateScanSetCore,
  type IScanSetSummary,
  type TUpdateScanSetInput,
  type TUpdateScanSetResult,
} from "./core";

/**
 * File-level `"use server"`: `ScanSetForm` (a client component) imports this module, so every
 * export is an async function and the logic stays in `core.ts`, as in Phase 1's features.
 */

async function requireUserId(): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

/** LAB-3: saves the scan set's lab and details, then records D22's `scan_set_saved`. */
export async function updateScanSetAction(input: TUpdateScanSetInput): Promise<TUpdateScanSetResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "not_found" };

  const result = await updateScanSetCore(getDb(), userId, input);
  if (result.ok) {
    await captureServerEvent({
      distinctId: userId,
      event: "scan_set_saved",
      properties: { has_lab: Boolean(input.labId), has_branch: Boolean(input.labBranchId) },
    });
  }
  return result;
}

export async function getScanSetForRollAction(rollId: string): Promise<IScanSetSummary | null> {
  const userId = await requireUserId();
  if (!userId) return null;
  return getScanSetForRollCore(getDb(), userId, rollId);
}
