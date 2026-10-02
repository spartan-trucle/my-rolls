"use server";

import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { captureServerEvent } from "@/lib/posthog-server";
import { getR2Env } from "@/lib/r2";
import { listLibraryCore, type ILibraryPage, type TLibraryFilter } from "./core";
import { parseFilter } from "./filters";
import { LIBRARY_VIEW_COOKIE, ROLL_VIEW_COOKIE, resolveLibraryView, resolveRollView } from "./view-pref";

const EMPTY: ILibraryPage = { totals: { rolls: 0, frames: 0, keepers: 0 }, counts: { all: 0, keeper: 0, oops: 0 }, groups: [], nextCursor: null };

export async function listLibraryAction(input: { filter: string; cursor?: string | null }): Promise<ILibraryPage> {
  const userId = await sessionUserIdForAction();
  if (!userId) return EMPTY;
  const filter = parseFilter(input.filter, { allowBlank: false }) as TLibraryFilter;
  return listLibraryCore(getDb(), userId, { filter, cursor: input.cursor, publicUrl: getR2Env().R2_PUBLIC_URL });
}

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * COL-1 / COL-3 "the last view used is remembered", plan D7: a year-long
 * cookie the page reads when its URL has no `view`. Anything but a known
 * view stores the default; anything but `roll` is the library. Emits
 * `view_switched` (D17).
 */
export async function rememberViewAction(input: { surface: "roll" | "library"; view: string }): Promise<void> {
  const userId = await sessionUserIdForAction();
  if (!userId) return;
  const surface = input.surface === "roll" ? "roll" : "library";
  const view = surface === "roll" ? resolveRollView(input.view, undefined) : resolveLibraryView(input.view, undefined);
  (await cookies()).set(surface === "roll" ? ROLL_VIEW_COOKIE : LIBRARY_VIEW_COOKIE, view, {
    maxAge: YEAR_IN_SECONDS,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  });
  await captureServerEvent({ distinctId: userId, event: "view_switched", properties: { surface, view } });
}
