import "server-only";

import { z } from "zod";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { toSearchText } from "@/lib/search-text";

/**
 * CAT-2's format choices — the only two the seed data and the design
 * system's `stock-*` swatches know about (D4: `formats` is `text[]`, not
 * a single value).
 */
const FORMATS = ["35mm", "120"] as const;

// E3 (audit, approved by the owner 27.09.2026): camera's own format list
// adds "other" ("Khác") — `camera.format` is free `text` already, so no
// migration. Stock's `formats` stays 35mm/120 only; the board's "Khác"
// chip is camera-only.
const CAMERA_FORMATS = [...FORMATS, "other"] as const;

// gold | green | blue | mono | rose (design system `stock-*` colour
// families, `stock.canister_color`): CustomEntryForm's "Loại film" chips
// (D1) are this field, not the free-text `type` below.
const CANISTER_COLORS = ["gold", "green", "blue", "mono", "rose"] as const;

export const stockInputSchema = z.object({
  brand: z.string().trim().min(1),
  name: z.string().trim().min(1),
  iso: z.number().int().positive().optional(),
  formats: z.array(z.enum(FORMATS)).optional(),
  type: z.string().trim().min(1).optional(),
  canisterColor: z.enum(CANISTER_COLORS).optional(),
  // BAG-2 (Round 2, audit E2): CustomEntryForm's "Đang có" stepper — how
  // many rolls of this new stock the caller already owns. Omitted means
  // "not counted" (`bag_item.qty` stays `null`), same as the catalogue
  // picker's `addToBag`.
  qty: z.number().int().min(0).optional(),
});

export const cameraInputSchema = z.object({
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  format: z.enum(CAMERA_FORMATS).optional(),
});

export const lensInputSchema = z.object({
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
 * `"use server"` wrapper in `actions.ts` is the only caller that parses
 * raw input.
 *
 * `import "server-only"` (top of file) keeps this — and its DB imports —
 * out of the client bundle even though `actions.ts` re-exports thin
 * wrappers around it for client components to call.
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
        canisterColor: input.canisterColor ?? null,
        searchText: toSearchText(`${input.brand} ${input.name}`),
      })
      .returning();

    const [bagItemRow] = await tx
      .insert(bagItem)
      .values({ userId, kind: "stock", refId: stockRow.id, qty: input.qty ?? null })
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
        format: input.format ?? null,
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
