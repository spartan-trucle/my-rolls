"use server";

import type { TMistakeType } from "@/db/schema";
import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { captureServerEvent } from "@/lib/posthog-server";
import { listRollMistakesCore, setMistakesCore, type IRollMistake, type TSetMistakesResult } from "./core";

/** File-level "use server": client components import these, so every export is async; logic is in core.ts. */

export async function setMistakesAction(input: {
  rollId: string;
  frameId: string | null;
  items: Array<{ type: TMistakeType; note?: string }>;
}): Promise<TSetMistakesResult> {
  const userId = await sessionUserIdForAction();
  if (!userId) return { ok: false, error: "not_found" };
  const result = await setMistakesCore(getDb(), userId, input);
  if (result.ok) {
    await captureServerEvent({
      distinctId: userId,
      event: "mistake_tagged",
      properties: { on: input.frameId ? "frame" : "roll", types: input.items.map((i) => i.type) },
    });
  }
  return result;
}

export async function listRollMistakesAction(rollId: string): Promise<IRollMistake[]> {
  const userId = await sessionUserIdForAction();
  return userId ? listRollMistakesCore(getDb(), userId, rollId) : [];
}
