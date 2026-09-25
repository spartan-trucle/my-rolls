"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

const MAX_NAME_LENGTH = 50;

export type TUpdateDisplayNameErrorCode = "empty" | "tooLong";

export interface IUpdateDisplayNameState {
  errorCode?: TUpdateDisplayNameErrorCode;
}

/**
 * Step 2's "Tiếp tục" (D18): trims the name, rejects empty or over 50
 * characters with a code the client component (`ProfileForm`) turns into
 * copy from `messages/vi.json`, otherwise saves it through Better Auth and
 * sends the new user home. `useActionState` in `ProfileForm` supplies
 * `prevState` — unused here, there's nothing to carry over between
 * attempts.
 */
export async function updateDisplayNameAction(
  _prevState: IUpdateDisplayNameState,
  formData: FormData,
): Promise<IUpdateDisplayNameState> {
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";

  if (name.length === 0) return { errorCode: "empty" };
  if (name.length > MAX_NAME_LENGTH) return { errorCode: "tooLong" };

  await getAuth().api.updateUser({ body: { name }, headers: await headers() });
  redirect("/");
}
