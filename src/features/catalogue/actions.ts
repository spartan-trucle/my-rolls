import { headers } from "next/headers";
import { z } from "zod";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { bagItem, camera, lens, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { getAuth } from "@/lib/auth";
import { toSearchText } from "@/lib/search-text";

/**
 * CAT-2's format choices — the only two the seed data and the design
 * system's `stock-*` swatches know about (D4: `formats` is `text[]`, not
 * a single value).
 */
const FORMATS = ["35mm", "120"] as const;

const stockInputSchema = z.object({
  brand: z.string().trim().min(1),
  name: z.string().trim().min(1),
  iso: z.number().int().positive().optional(),
  formats: z.array(z.enum(FORMATS)).optional(),
  type: z.string().trim().min(1).optional(),
});

const cameraInputSchema = z.object({
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
});

const lensInputSchema = z.object({
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1).optional(),
  focalLength: z.string().trim().min(1).optional(),
});

export type TAddCustomStockInput = z.infer<typeof stockInputSchema>;
export type TAddCustomCameraInput = z.infer<typeof cameraInputSchema>;
export type TAddCustomLensInput = z.infer<typeof lensInputSchema>;

export type TAddCustomErrorCode = "unauthenticated" | "validation";

export type TAddCustomResult =
  | { ok: true; refId: string; bagItemId: string }
  | { ok: false; error: TAddCustomErrorCode };

/**
 * D12: the custom entry and its bag item, in one `transaction` — a bag
 * insert that fails (a bug, a constraint) rolls back the entry too, so
 * there's never an orphan private stock/camera/lens with nothing in the
 * bag pointing at it. Assumes `input` is already zod-validated; the thin
 * `"use server"` wrapper below is the only caller that parses raw input.
 */
export async function addCustomStockCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TAddCustomStockInput,
): Promise<TAddCustomResult> {
  return db.transaction(async (tx) => {
    const [stockRow] = await tx
      .insert(stock)
      .values({
        ownerId: userId,
        brand: input.brand,
        name: input.name,
        iso: input.iso ?? null,
        formats: input.formats ?? null,
        type: input.type ?? null,
        searchText: toSearchText(`${input.brand} ${input.name}`),
      })
      .returning();

    const [bagItemRow] = await tx
      .insert(bagItem)
      .values({ userId, kind: "stock", refId: stockRow.id })
      .returning();

    return { ok: true, refId: stockRow.id, bagItemId: bagItemRow.id };
  });
}

export async function addCustomCameraCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TAddCustomCameraInput,
): Promise<TAddCustomResult> {
  return db.transaction(async (tx) => {
    const [cameraRow] = await tx
      .insert(camera)
      .values({
        ownerId: userId,
        brand: input.brand,
        model: input.model,
        searchText: toSearchText(`${input.brand} ${input.model}`),
      })
      .returning();

    const [bagItemRow] = await tx
      .insert(bagItem)
      .values({ userId, kind: "camera", refId: cameraRow.id })
      .returning();

    return { ok: true, refId: cameraRow.id, bagItemId: bagItemRow.id };
  });
}

export async function addCustomLensCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TAddCustomLensInput,
): Promise<TAddCustomResult> {
  return db.transaction(async (tx) => {
    const [lensRow] = await tx
      .insert(lens)
      .values({
        ownerId: userId,
        brand: input.brand,
        model: input.model ?? null,
        focalLength: input.focalLength ?? null,
      })
      .returning();

    const [bagItemRow] = await tx
      .insert(bagItem)
      .values({ userId, kind: "lens", refId: lensRow.id })
      .returning();

    return { ok: true, refId: lensRow.id, bagItemId: bagItemRow.id };
  });
}

async function requireUserId(): Promise<string | undefined> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id;
}

/**
 * `"use server"` wrappers (D19): get the caller from the Better Auth
 * session, zod-validate the raw input, then delegate to the core
 * function above. An unauthenticated caller or a failed validation comes
 * back as a typed error, never a throw that leaks past the action
 * boundary.
 */
export async function addCustomStock(input: unknown): Promise<TAddCustomResult> {
  "use server";

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = stockInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomStockCore(getDb(), userId, parsed.data);
}

export async function addCustomCamera(input: unknown): Promise<TAddCustomResult> {
  "use server";

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = cameraInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomCameraCore(getDb(), userId, parsed.data);
}

export async function addCustomLens(input: unknown): Promise<TAddCustomResult> {
  "use server";

  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = lensInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return addCustomLensCore(getDb(), userId, parsed.data);
}
