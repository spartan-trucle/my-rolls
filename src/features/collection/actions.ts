"use server";

import { getDb } from "@/db/client";
import { sessionUserIdForAction } from "@/features/shared/session-user";
import { captureServerEvent } from "@/lib/posthog-server";
import { getR2Env } from "@/lib/r2";
import {
  libraryTotalsCore,
  listLibraryCore,
  listLibraryInputSchema,
  viewSwitchInputSchema,
  type ILibraryPage,
  type ILibraryTotals,
  type TLibraryFilter,
} from "./core";
import { parseFilter } from "./filters";
import { resolveLibraryView, resolveRollView } from "./view-pref";

const EMPTY: ILibraryPage = { totals: { rolls: 0, frames: 0, keepers: 0 }, counts: { all: 0, keeper: 0, oops: 0 }, groups: [], nextCursor: null };

export async function listLibraryAction(raw: { filter: string; cursor?: string | null }): Promise<ILibraryPage> {
  const userId = await sessionUserIdForAction();
  if (!userId) return EMPTY;
  const parsed = listLibraryInputSchema.safeParse(raw);
  if (!parsed.success) return EMPTY;
  const input = parsed.data;
  const filter = parseFilter(input.filter, { allowBlank: false }) as TLibraryFilter;
  return listLibraryCore(getDb(), userId, { filter, cursor: input.cursor, publicUrl: getR2Env().R2_PUBLIC_URL });
}

/** Ruling R8: the shelf's count line, without loading a page of frames. Zeros with no session. */
export async function libraryTotalsAction(): Promise<ILibraryTotals> {
  const userId = await sessionUserIdForAction();
  if (!userId) return { ...EMPTY.totals };
  return libraryTotalsCore(getDb(), userId);
}

/**
 * D17 `view_switched`, sent by ViewSwitch without waiting on it. Sets no cookie: a cookie set in a
 * Server Action makes Next re-render the current route before the switch's push (Ruling R31,
 * superseding R11), so ViewSwitch writes `viewCookie` itself. Anything but a known view reports
 * the default; anything but `roll` is the library.
 */
export async function trackViewSwitchAction(raw: { surface: "roll" | "library"; view: string }): Promise<void> {
  const userId = await sessionUserIdForAction();
  if (!userId) return;
  const parsed = viewSwitchInputSchema.safeParse(raw);
  if (!parsed.success) return;
  const surface = parsed.data.surface === "roll" ? "roll" : "library";
  const view = surface === "roll" ? resolveRollView(parsed.data.view, undefined) : resolveLibraryView(parsed.data.view, undefined);
  await captureServerEvent({ distinctId: userId, event: "view_switched", properties: { surface, view } });
}
