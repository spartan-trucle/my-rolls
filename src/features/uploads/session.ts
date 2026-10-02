import "server-only";

import { getAuth } from "@/lib/auth";

/** The signed-in user's id for a route handler, read from the request's own headers. */
export async function sessionUserId(request: Request): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}
