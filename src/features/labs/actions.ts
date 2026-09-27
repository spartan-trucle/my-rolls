"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { getAuth } from "@/lib/auth";
import {
  addLabCore,
  listLabCities,
  searchLabs,
  type ILabWithBranches,
  type TAddLabInput,
  type TAddLabResult,
} from "./core";

/**
 * File-level `"use server"` (not per-function): this module is imported
 * by F2's lab picker, a client component, and Next only allows the
 * directive at the top of a whole "actions" module in that case. Every
 * export must be an async function (`actions.test.ts` checks this, and
 * Next's build enforces it for a `"use server"` file) — no type
 * re-exports here even though they'd be erased before that check runs;
 * `core.ts` already exports `TAddLabInput`/`TAddLabResult` directly for
 * F2 to import instead. This file stays thin: the real logic lives in
 * `core.ts`, which it's the only server-action caller of.
 */

/**
 * The real entry point: reads the caller from Better Auth's session
 * cookie (unauthenticated → `addLabCore`'s typed error, never a thrown
 * redirect — this is a data mutation, not a page action) and the app's
 * pooled `getDb()`, then hands off to the tested `addLabCore`.
 */
export async function addLabAction(
  input: TAddLabInput,
): Promise<TAddLabResult> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return addLabCore(getDb(), session?.user.id ?? null, input);
}

/**
 * F2's `LabPicker`: reads the caller the same way `addLabAction` does (a
 * visitor is allowed here — `searchLabs` accepts `userId: null` and just
 * skips the private-lab half of the `or()`, per `core.ts`), then hands
 * off to the tested `searchLabs`.
 */
export async function searchLabsAction({
  q,
  city,
}: {
  q?: string;
  city?: string;
}): Promise<ILabWithBranches[]> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return searchLabs(getDb(), { q, city, userId: session?.user.id ?? null });
}

/** F2's city chips. */
export async function listLabCitiesAction(): Promise<string[]> {
  return listLabCities(getDb());
}
