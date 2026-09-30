import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, max } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { frame, roll, scanSet } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import type { TR2Bucket } from "@/lib/r2";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "./limits";

/** D15: the browser asks for slots 12 files at a time. */
export const MAX_FILES_PER_SLOT_REQUEST = 12;

const COPY_TYPES = ["image/webp", "image/jpeg"] as const;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const slotFileSchema = z.object({
  clientId: z.string().min(1).max(100),
  fileName: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_UPLOAD_TYPES),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  exif: z.record(z.string(), z.unknown()),
  /** Ignored: the server numbers frames after the roll's highest position (review #2). */
  position: z.number().int().positive().optional(),
  copyType: z.enum(COPY_TYPES),
  gridBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  viewBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export type ISlotFile = z.infer<typeof slotFileSchema>;

export const slotsRequestSchema = z.object({
  rollId: z.uuid(),
  files: z.array(z.unknown()).min(1),
});

export interface ISlot {
  clientId: string;
  frameId: string;
  originalUrl: string;
  gridUrl: string;
  viewUrl: string;
}

export type TSlotsResult =
  | { ok: true; scanSetId: string; slots: ISlot[] }
  | { ok: false; error: "not_found" | "too_many" | "invalid_input" }
  | { ok: false; error: "invalid_file"; clientId: string };

export type TSign = (input: { bucket: TR2Bucket; key: string; contentType: string; size: number }) => Promise<string>;
export type THead = (input: { bucket: TR2Bucket; key: string }) => Promise<{ contentLength: number } | null>;

async function liveScanSetId<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  rollId: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ id: scanSet.id })
    .from(scanSet)
    .where(and(eq(scanSet.rollId, rollId), isNull(scanSet.deletedAt)))
    .limit(1);
  return row?.id;
}

/**
 * Phase 2 plan B2 (SCAN-1, D9, D10): checks the roll is the caller's, finds or creates its one
 * scan set, inserts the files as `pending` frames and signs a PUT per object. The frame id is
 * made here so the original's key can carry it (the cleanup cron needs no lookup); the copies
 * get random keys so a public URL never reveals a frame id.
 */
export async function requestSlotsCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { rollId: string; files: unknown[] },
  deps: { sign: TSign },
): Promise<TSlotsResult> {
  if (input.files.length > MAX_FILES_PER_SLOT_REQUEST) return { ok: false, error: "too_many" };
  if (input.files.length === 0) return { ok: false, error: "invalid_input" };

  const files: ISlotFile[] = [];
  for (const raw of input.files) {
    const parsed = slotFileSchema.safeParse(raw);
    if (!parsed.success) {
      const clientId = (raw as { clientId?: unknown })?.clientId;
      return typeof clientId === "string"
        ? { ok: false, error: "invalid_file", clientId }
        : { ok: false, error: "invalid_input" };
    }
    files.push(parsed.data);
  }

  // One transaction with the roll row locked: two slot requests for the same roll (parallel
  // groups, two tabs) can't hand out the same positions or race for the scan set.
  const created = await db.transaction(async (tx) => {
    const [owned] = await tx
      .select({ id: roll.id })
      .from(roll)
      .where(and(eq(roll.id, input.rollId), eq(roll.userId, userId), isNull(roll.deletedAt)))
      .for("update")
      .limit(1);
    if (!owned) return null;

    let scanSetId = await liveScanSetId(tx, input.rollId);
    if (!scanSetId) {
      const [inserted] = await tx
        .insert(scanSet)
        .values({ userId, rollId: input.rollId })
        .onConflictDoNothing()
        .returning({ id: scanSet.id });
      scanSetId = inserted?.id ?? (await liveScanSetId(tx, input.rollId));
      if (!scanSetId) return null;
    }

    // Review #2: positions come from the server, after every frame the roll ever had
    // (deleted ones too, so a restored frame never collides), in the order the files came.
    const [{ top }] = await tx.select({ top: max(frame.position) }).from(frame).where(eq(frame.rollId, input.rollId));
    const firstPosition = (top ?? 0) + 1;

    const rows = files.map((f, i) => {
      const id = randomUUID();
      const copyExt = EXTENSION[f.copyType];
      return {
        file: f,
        values: {
          id,
          userId,
          rollId: input.rollId,
          scanSetId: scanSetId!,
          position: firstPosition + i,
          fileName: f.fileName,
          contentType: f.contentType,
          bytes: f.bytes,
          sha256: f.sha256,
          width: f.width,
          height: f.height,
          exif: f.exif,
          originalKey: `originals/${userId}/${id}.${EXTENSION[f.contentType]}`,
          gridKey: `grid/${randomUUID()}.${copyExt}`,
          viewKey: `view/${randomUUID()}.${copyExt}`,
        },
      };
    });
    await tx.insert(frame).values(rows.map((r) => r.values));
    return { scanSetId, rows };
  });
  if (!created) return { ok: false, error: "not_found" };
  const { scanSetId, rows } = created;

  const slots = await Promise.all(
    rows.map(async ({ file: f, values: v }) => {
      const [originalUrl, gridUrl, viewUrl] = await Promise.all([
        deps.sign({ bucket: "originals", key: v.originalKey, contentType: f.contentType, size: f.bytes }),
        deps.sign({ bucket: "public", key: v.gridKey, contentType: f.copyType, size: f.gridBytes }),
        deps.sign({ bucket: "public", key: v.viewKey, contentType: f.copyType, size: f.viewBytes }),
      ]);
      return { clientId: f.clientId, frameId: v.id, originalUrl, gridUrl, viewUrl };
    }),
  );

  return { ok: true, scanSetId, slots };
}

export const confirmRequestSchema = z.object({
  frameIds: z.array(z.uuid()).min(1).max(MAX_FILES_PER_SLOT_REQUEST * 3),
});

export interface IConfirmResult {
  ready: string[];
  missing: string[];
}

/**
 * Phase 2 plan B2 (D14): for each of the caller's pending frames, HEADs the original and both
 * copies. The original must have exactly the bytes the slot was signed for. Anything else
 * leaves the frame `pending` for the browser to retry; the nightly cron cleans up the rest.
 * Other users' ids are dropped silently, and already-ready frames count as ready.
 */
export async function confirmFramesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  frameIds: string[],
  deps: { head: THead },
): Promise<IConfirmResult> {
  if (frameIds.length === 0) return { ready: [], missing: [] };

  const rows = await db
    .select()
    .from(frame)
    .where(and(inArray(frame.id, frameIds), eq(frame.userId, userId), isNull(frame.deletedAt)));

  const checked = await Promise.all(
    rows.map(async (row) => {
      if (row.status === "ready") return { id: row.id, ok: true };
      const [original, grid, view] = await Promise.all([
        deps.head({ bucket: "originals", key: row.originalKey }),
        deps.head({ bucket: "public", key: row.gridKey }),
        deps.head({ bucket: "public", key: row.viewKey }),
      ]);
      return { id: row.id, ok: original?.contentLength === row.bytes && grid !== null && view !== null };
    }),
  );

  const ready = checked.filter((c) => c.ok).map((c) => c.id);
  const missing = checked.filter((c) => !c.ok).map((c) => c.id);
  const newlyReady = rows.filter((r) => r.status === "pending" && ready.includes(r.id)).map((r) => r.id);
  if (newlyReady.length > 0) {
    await db
      .update(frame)
      .set({ status: "ready", updatedAt: new Date() })
      .where(and(inArray(frame.id, newlyReady), eq(frame.userId, userId)));
  }

  return { ready, missing };
}

/** D18: the original's key for the owner's ready, live frame; `null` for anything else. */
export async function getOriginalKeyCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  frameId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ key: frame.originalKey })
    .from(frame)
    .where(and(eq(frame.id, frameId), eq(frame.userId, userId), eq(frame.status, "ready"), isNull(frame.deletedAt)))
    .limit(1);
  return row?.key ?? null;
}
