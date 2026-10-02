"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { captureServerEvent } from "@/lib/posthog-server";
import { getR2Env } from "@/lib/r2";
import {
  deleteFrameCore,
  listRollFramesCore,
  moveFrameCore,
  restoreFrameCore,
  setFrameMarksCore,
  setFramesMarksCore,
  type IRollFrame,
  type TFrameResult,
} from "./core";

/** File-level "use server": client components import these, so every export is async; logic is in core.ts. */

const NOT_FOUND = { ok: false, error: "not_found" } as const;

export async function setFrameMarksAction(input: { frameId: string; isKeeper?: boolean; isBlank?: boolean }): Promise<TFrameResult> {
  const userId = await sessionUserIdForAction();
  if (!userId) return NOT_FOUND;
  const result = await setFrameMarksCore(getDb(), userId, input);
  if (result.ok) {
    const mark = input.isBlank !== undefined ? "blank" : "keeper";
    await captureServerEvent({
      distinctId: userId,
      event: "frame_marked",
      properties: { mark, on: mark === "blank" ? input.isBlank : input.isKeeper },
    });
  }
  return result;
}

export async function setFramesMarksAction(input: {
  rollId: string;
  frameIds: string[];
  mark: "keeper" | "blank";
  on: boolean;
  via: "button" | "key";
}): Promise<TFrameResult> {
  const userId = await sessionUserIdForAction();
  if (!userId) return NOT_FOUND;
  const { via, ...core } = input;
  const result = await setFramesMarksCore(getDb(), userId, core);
  if (result.ok) {
    await captureServerEvent({
      distinctId: userId,
      event: "frames_bulk_marked",
      properties: { mark: input.mark, on: input.on, count: input.frameIds.length, via },
    });
    revalidatePath(`/rolls/${input.rollId}`);
  }
  return result;
}

export async function moveFrameAction(input: { frameId: string; toPosition: number }): Promise<TFrameResult> {
  const userId = await sessionUserIdForAction();
  return userId ? moveFrameCore(getDb(), userId, input) : NOT_FOUND;
}

export async function deleteFrameAction(input: { frameId: string }): Promise<TFrameResult> {
  const userId = await sessionUserIdForAction();
  return userId ? deleteFrameCore(getDb(), userId, input) : NOT_FOUND;
}

export async function restoreFrameAction(input: { frameId: string }): Promise<TFrameResult> {
  const userId = await sessionUserIdForAction();
  return userId ? restoreFrameCore(getDb(), userId, input) : NOT_FOUND;
}

export async function listRollFramesAction(rollId: string): Promise<IRollFrame[]> {
  const userId = await sessionUserIdForAction();
  if (!userId) return [];
  return listRollFramesCore(getDb(), userId, rollId, { publicUrl: getR2Env().R2_PUBLIC_URL });
}
