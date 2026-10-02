"use server";

import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { getR2Env } from "@/lib/r2";
import { listLibraryCore, type ILibraryPage, type TLibraryFilter } from "./core";
import { parseFilter } from "./filters";

const EMPTY: ILibraryPage = { totals: { rolls: 0, frames: 0, keepers: 0 }, counts: { all: 0, keeper: 0, oops: 0 }, groups: [], nextCursor: null };

export async function listLibraryAction(input: { filter: string; cursor?: string | null }): Promise<ILibraryPage> {
  const userId = await sessionUserIdForAction();
  if (!userId) return EMPTY;
  const filter = parseFilter(input.filter, { allowBlank: false }) as TLibraryFilter;
  return listLibraryCore(getDb(), userId, { filter, cursor: input.cursor, publicUrl: getR2Env().R2_PUBLIC_URL });
}
