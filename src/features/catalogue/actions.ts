"use server";

import { headers } from "next/headers";
import { getDb } from "@/db/client";
import {
  addCustomCameraCore,
  addCustomLensCore,
  addCustomStockCore,
  cameraInputSchema,
  lensInputSchema,
  stockInputSchema,
  type TAddCustomResult,
} from "@/features/catalogue/core";
import {
  getCatalogueBySlugs as getCatalogueBySlugsQuery,
  searchCatalogue as searchCatalogueQuery,
  type TCatalogueEntry,
  type TCatalogueKind,
} from "@/features/catalogue/queries";
import { getAuth } from "@/lib/auth";

/**
 * File-level `"use server"`: every export here must be an async function
 * (Next.js's rule for a Server Actions module), which is also what lets
 * client components (D1's `CataloguePicker`/`CustomEntryForm`, F1's
 * onboarding chips) import this file directly. The core transaction logic
 * and its DB imports live in `core.ts` instead, behind `import
 * "server-only"`, so they never end up in the client bundle.
 */

async function requireUserId(): Promise<string | undefined> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id;
}

/**
 * `"use server"` wrappers (D19): get the caller from the Better Auth
 * session, zod-validate the raw input, then delegate to `core.ts`. An
 * unauthenticated caller or a failed validation comes back as a typed
 * error, never a throw that leaks past the action boundary.
 */
export async function addCustomStock(input: unknown): Promise<TAddCustomResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = stockInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomStockCore(getDb(), userId, parsed.data);
}

export async function addCustomCamera(input: unknown): Promise<TAddCustomResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = cameraInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomCameraCore(getDb(), userId, parsed.data);
}

export async function addCustomLens(input: unknown): Promise<TAddCustomResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = lensInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomLensCore(getDb(), userId, parsed.data);
}

export type TSearchCatalogueResult =
  | { ok: true; entries: TCatalogueEntry[] }
  | { ok: false; error: "unauthenticated" };

/**
 * D1's read side: `CataloguePicker`'s debounced search, session-checked
 * like every write above, delegating the actual query (ranking, privacy)
 * to `queries.ts`'s `searchCatalogue` (B4).
 */
export async function searchCatalogue(input: { kind: TCatalogueKind; q: string }): Promise<TSearchCatalogueResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const entries = await searchCatalogueQuery(getDb(), { kind: input.kind, q: input.q, userId });
  return { ok: true, entries };
}

export type TGetCatalogueBySlugsResult =
  | { ok: true; entries: TCatalogueEntry[] }
  | { ok: false; error: "unauthenticated" };

/**
 * F1's curated onboarding chips (`POPULAR_CAMERA_SLUGS` /
 * `POPULAR_STOCK_SLUGS`): session-checked like every other action here,
 * delegating the actual lookup to `queries.ts`'s `getCatalogueBySlugs`.
 */
export async function getCatalogueBySlugs(input: {
  kind: TCatalogueKind;
  slugs: readonly string[];
}): Promise<TGetCatalogueBySlugsResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const entries = await getCatalogueBySlugsQuery(getDb(), { kind: input.kind, slugs: input.slugs });
  return { ok: true, entries };
}
