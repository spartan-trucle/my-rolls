import "server-only";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

/** The signed-in user's id for a Server Action, or null. */
export async function sessionUserIdForAction(): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}
