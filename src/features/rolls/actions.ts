"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import {
  createRollCore,
  createRollInputSchema,
  getRollCore,
  listRollsCore,
  peekNextRollNumberCore,
  setCanisterCore,
  setCanisterInputSchema,
  updateRollCore,
  updateRollInputSchema,
  type IRollEntry,
  type TCreateRollResult,
  type TSetCanisterResult,
  type TUpdateRollResult,
} from "@/features/rolls/core";
import type { TCanisterStyle } from "@/features/canister/look";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { getAuth } from "@/lib/auth";
import { captureServerEvent } from "@/lib/posthog-server";
import { getR2Env } from "@/lib/r2";

/**
 * File-level `"use server"`: every export here must be an async function
 * (Next.js's rule for a Server Actions module), which is also what lets
 * client components (D3's `RollForm`, F3's `RollCard` list, the roll
 * page) import this file directly. The actual query/mutation logic and
 * its DB imports live in `core.ts` instead, behind `import
 * "server-only"`, so they never end up in the client bundle.
 */

async function requireUserId(): Promise<string | undefined> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id;
}

/**
 * D16: fires the `roll_created` PostHog event once a roll is saved,
 * `distinct_id` = the caller's user id. `duration_ms` is only sent when
 * `formOpenedAt` was provided and the elapsed time isn't negative (a
 * clock skew or a missing value shouldn't produce a nonsensical
 * duration); `has_optional_details` is true once the caller filled in
 * anything beyond the two required picks (stock, camera).
 *
 * Never awaited-and-thrown into the caller: `captureServerEvent` already
 * swallows its own failures, so a PostHog outage can never fail
 * `createRoll`.
 */
async function trackRollCreated(
  userId: string,
  input: Parameters<typeof createRollCore>[2],
): Promise<void> {
  const hasOptionalDetails =
    input.lensId !== undefined ||
    input.name !== undefined ||
    input.shotIso !== undefined ||
    input.exposures !== undefined ||
    input.format !== undefined ||
    (input.locations !== undefined && input.locations.length > 0);

  const durationMs =
    input.formOpenedAt !== undefined ? Date.now() - input.formOpenedAt : undefined;

  const properties: Record<string, unknown> = {
    mode: input.mode,
    has_optional_details: hasOptionalDetails,
  };
  if (durationMs !== undefined && durationMs >= 0) {
    properties.duration_ms = durationMs;
  }

  await captureServerEvent({ distinctId: userId, event: "roll_created", properties });
}

/**
 * `"use server"` wrapper (D19): gets the caller from the Better Auth
 * session, zod-validates the raw input, then delegates to `core.ts`. On
 * success, captures the `roll_created` event (D16) — its own failures
 * never propagate, per `captureServerEvent`.
 */
export async function createRoll(input: unknown): Promise<TCreateRollResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = createRollInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  const result = await createRollCore(getDb(), userId, parsed.data);

  if (result.ok) {
    await trackRollCreated(userId, parsed.data);
  }

  return result;
}

/** D15: the caller's own rolls, newest first, for the home list. */
export async function listRolls(): Promise<IRollEntry[]> {
  const userId = await requireUserId();
  if (!userId) return [];

  return listRollsCore(getDb(), userId, { publicUrl: getR2Env().R2_PUBLIC_URL });
}

/** D15: a single roll's data for `/rolls/[id]`, or `null` when it doesn't exist or isn't the caller's own. */
export async function getRoll(rollId: string): Promise<IRollEntry | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  return getRollCore(getDb(), userId, rollId, { publicUrl: getR2Env().R2_PUBLIC_URL });
}

/** N1: the "Cuộn #N" the form's header/name hint would use if saved right now — `null` when signed out. */
export async function getNextRollNumber(): Promise<number | null> {
  const userId = await requireUserId();
  if (!userId) return null;

  return peekNextRollNumberCore(getDb(), userId);
}

/**
 * R4: the `"use server"` wrapper (D19) around `updateRollCore` — same
 * shape as `createRoll`: session, zod, delegate, typed error instead of a
 * throw.
 */
export async function updateRoll(input: unknown): Promise<TUpdateRollResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "unauthenticated" };

  const parsed = updateRollInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };

  return updateRollCore(getDb(), userId, parsed.data);
}

/** CAN-2: saves how a roll's canister looks; `drawn` carries a preset or `#rrggbb`. */
export async function setCanisterAction(raw: {
  rollId: string;
  style: TCanisterStyle;
  color?: string;
}): Promise<TSetCanisterResult> {
  const userId = await sessionUserIdForAction();
  if (!userId) return { ok: false, error: "not_found" };
  const parsed = setCanisterInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  const input = parsed.data;
  const result = await setCanisterCore(getDb(), userId, input);
  if (result.ok) {
    await captureServerEvent({
      distinctId: userId,
      event: "canister_customised",
      properties: {
        style: input.style,
        color: input.style === "drawn" ? (input.color?.startsWith("#") ? "custom" : input.color) : undefined,
      },
    });
    revalidatePath(`/rolls/${input.rollId}`);
    revalidatePath("/");
  }
  return result;
}
