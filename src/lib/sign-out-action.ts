"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/auth";

/**
 * Server-side sign-out: clears the session through Better Auth's own API
 * (which, via the `nextCookies()` plugin, forwards the resulting
 * `Set-Cookie` to Next's cookie jar) and sends the user back to
 * `/sign-in`. Stage F's "Dùng tài khoản Google khác" button calls this.
 */
export async function signOutAction(): Promise<never> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
