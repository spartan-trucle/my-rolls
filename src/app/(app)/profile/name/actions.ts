"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";

export type TUpdateNameErrorCode = "empty" | "tooLong";

export interface IUpdateNameState {
  errorCode?: TUpdateNameErrorCode;
}

const MAX_NAME_LENGTH = 50;

const nameSchema = z.string().trim().min(1, "empty").max(MAX_NAME_LENGTH, "tooLong");

/**
 * `/profile/name`'s form (F4, Phase 0 D18, this plan's D19): zod trims
 * and checks 1–50 chars, the same rule `/sign-up/profile`'s own action
 * enforces. On success it redirects back to `/profile`, same shape as
 * that one-shot onboarding action, since this sub-route has nowhere else
 * useful to stay once the name is saved.
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
  redirect("/profile");
}
