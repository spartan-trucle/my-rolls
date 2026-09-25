"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";

async function performSignOut(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
}

/**
 * Server-side sign-out: clears the session through Better Auth's own API
 * (which, via the `nextCookies()` plugin, forwards the resulting
 * `Set-Cookie` to Next's cookie jar) and sends the user back to
 * `/sign-in`. The placeholder home's sign-out button (D17) calls this.
 */
export async function signOutAction(): Promise<never> {
  await performSignOut();
  redirect("/sign-in");
}

/**
 * Step 2's "Dùng tài khoản Google khác" / "Dùng tài khoản khác": signs out
 * and sends the user back to `/sign-up` instead of `/sign-in`, so picking a
 * different Google account doesn't first flash the returning-user screen.
 *
 * A dedicated action, not a `signOutAction(target)` parameter: a server
 * action bound straight to a `<form action>` is always called with
 * `FormData` as its only argument, so a `target` parameter there would
 * silently receive the form data instead of a redirect target. Two named
 * exports are the allow-list this needs, and neither can be bypassed at
 * the call site.
 */
export async function signOutToSignUpAction(): Promise<never> {
  await performSignOut();
  redirect("/sign-up");
}
