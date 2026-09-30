"use server";

import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { captureServerEvent } from "@/lib/posthog-server";
import { deleteNoteCore, listRollNotesCore, saveMemoryCore, saveNoteCore, type IRollNote, type TSaveNoteResult } from "./core";

/** File-level "use server": client components import these, so every export is async; logic is in core.ts. */

export async function saveNoteAction(input: {
  noteId?: string;
  rollId: string;
  frameId?: string | null;
  body: string;
}): Promise<TSaveNoteResult> {
  const userId = await sessionUserIdForAction();
  if (!userId) return { ok: false, error: "not_found" };
  const result = await saveNoteCore(getDb(), userId, input);
  // D22: once per new note, not on every autosave of an existing one.
  if (result.ok && !input.noteId) {
    await captureServerEvent({ distinctId: userId, event: "note_saved", properties: { on: input.frameId ? "frame" : "roll" } });
  }
  return result;
}

export async function deleteNoteAction(input: { noteId: string }) {
  const userId = await sessionUserIdForAction();
  return userId ? deleteNoteCore(getDb(), userId, input) : ({ ok: false, error: "not_found" } as const);
}

export async function saveMemoryAction(input: { rollId: string; memory: string }) {
  const userId = await sessionUserIdForAction();
  return userId ? saveMemoryCore(getDb(), userId, input) : ({ ok: false, error: "not_found" } as const);
}

export async function listRollNotesAction(rollId: string): Promise<IRollNote[]> {
  const userId = await sessionUserIdForAction();
  return userId ? listRollNotesCore(getDb(), userId, rollId) : [];
}
