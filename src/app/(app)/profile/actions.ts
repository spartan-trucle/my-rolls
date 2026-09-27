"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth";

export type TUpdateNameErrorCode = "empty" | "tooLong";

export interface IUpdateNameState {
  errorCode?: TUpdateNameErrorCode;
  savedName?: string;
}

const MAX_NAME_LENGTH = 50;

const nameSchema = z.string().trim().min(1, "empty").max(MAX_NAME_LENGTH, "tooLong");

/**
 * Profile's display-name form (Phase 0 D18, this plan's D19): zod trims
 * and checks 1–50 chars, the same rule `/sign-up/profile`'s own action
 * enforces. Unlike that one, this stays on `/profile` after saving — no
 * redirect, just `revalidatePath` so the server-rendered `name` prop picks
 * up the change on the next request.
 *
 * Better Auth's `updateUser` reads the caller from the session cookie
 * inside `headers()`; there is no user id anywhere in the request, so
 * whatever a form submits, only the signed-in caller's own name is ever
 * written.
 */
export async function updateNameAction(
  _prevState: IUpdateNameState,
  formData: FormData,
): Promise<IUpdateNameState> {
  const raw = formData.get("name");
  const result = nameSchema.safeParse(typeof raw === "string" ? raw : "");

  if (!result.success) {
    return { errorCode: result.error.issues[0]?.message as TUpdateNameErrorCode };
  }

  await getAuth().api.updateUser({ body: { name: result.data }, headers: await headers() });
  revalidatePath("/profile");
  return { savedName: result.data };
}
