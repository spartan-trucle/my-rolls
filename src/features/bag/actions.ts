"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import {
  addToBagCore,
  removeFromBagCore,
  type IAddToBagInput,
  type IRemoveFromBagInput,
  type TAddToBagResult,
  type TRemoveFromBagResult,
} from "@/features/bag/core";
import { listBag as listBagQuery, type TBagEntry } from "@/features/bag/queries";
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
