"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import {
  addToBagCore,
  removeFromBagCore,
  setStockExpiryYearCore,
  setStockQtyCore,
  type IAddToBagInput,
  type IRemoveFromBagInput,
  type ISetStockExpiryYearInput,
  type ISetStockQtyInput,
  type TAddToBagResult,
  type TRemoveFromBagResult,
  type TSetStockExpiryYearResult,
  type TSetStockQtyResult,
} from "@/features/bag/core";
import {
  getProfileSummary as getProfileSummaryQuery,
  listBag as listBagQuery,
  summarizeBag,
  type IBagSummary,
  type IProfileSummary,
  type TBagEntry,
} from "@/features/bag/queries";
import { getAuth } from "@/lib/auth";

/**
 * File-level `"use server"`: every export here must be an async function
 * (Next.js's rule for a Server Actions module), which is also what lets
 * client components (D2's `/bag` picker, F1's onboarding chips) import
 * this file directly. The actual query/mutation logic and its DB imports
 * live in `core.ts` instead, behind `import "server-only"`, so they never
 * end up in the client bundle.
 */

async function requireUserId(): Promise<string | undefined> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id;
}

/**
 * `"use server"` wrappers: get the caller from the Better Auth session —
 * an unauthenticated caller comes back as a typed error, never a throw
 * that leaks past the action boundary.
 */
export async function addToBag(input: IAddToBagInput): Promise<TAddToBagResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  return addToBagCore(getDb(), userId, input);
}

export async function removeFromBag(input: IRemoveFromBagInput): Promise<TRemoveFromBagResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  return removeFromBagCore(getDb(), userId, input);
}

/**
 * D2: `/bag` re-fetches through this after every add, remove or undo,
 * rather than trying to patch `TBagEntry`'s joined rows together from
 * `CataloguePicker`'s or `CustomEntryForm`'s own (narrower) result shapes —
 * one source of truth, still no full page reload. An unauthenticated
 * caller (session expired mid-visit) gets an empty bag rather than a throw.
 */
export async function listBag(): Promise<TBagEntry[]> {
  const userId = await requireUserId();
  if (!userId) return [];

  return listBagQuery(getDb(), userId);
}

/** BAG-2 (Round 2): sets how many rolls of a stock bag item are left, or `null` to stop counting. */
export async function setStockQty(input: ISetStockQtyInput): Promise<TSetStockQtyResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  return setStockQtyCore(getDb(), userId, input);
}

/** BAG-2 (Round 2): sets a stock bag item's expiry year, or `null` to clear it. */
export async function setStockExpiryYear(input: ISetStockExpiryYearInput): Promise<TSetStockExpiryYearResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  return setStockExpiryYearCore(getDb(), userId, input);
}

/**
 * B7/B1 (Round 2): the bag's summary counts and canister strip, computed
 * from the same `listBag` read `/bag` already does — a second Server
 * Action rather than folding into `listBag`'s own return, so existing
 * callers of `listBag()` (the picker flows, onboarding) keep their
 * `TBagEntry[]` shape unchanged.
 */
export async function getBagSummary(): Promise<IBagSummary> {
  const userId = await requireUserId();
  if (!userId) return { unloadedRolls: 0, filmTypeCount: 0, cameraCount: 0, lensCount: 0, canisters: [] };

  const entries = await listBagQuery(getDb(), userId);
  return summarizeBag(entries);
}

/** PR1/PR4 (Round 2): Profile's roll count, bag preview and join date. `null` for an unauthenticated caller. */
export async function getProfileSummary(): Promise<IProfileSummary | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  return getProfileSummaryQuery(getDb(), userId);
}
