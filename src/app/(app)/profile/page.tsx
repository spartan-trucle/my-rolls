import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { ProfileContent } from "./ProfileContent";

/**
 * `/profile` (F4, Phase 0 D18): reads the real session server-side —
 * `proxy.ts`'s cookie check is only optimistic, and `/profile` isn't in
 * its public paths, so a signed-out request is already redirected there
 * before this ever runs. This second check is defensive (matches
 * `/sign-up/profile`'s own page) and gives a real name/email/image to
 * pass down instead of an assumed one.
 */
export default async function ProfilePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  return <ProfileContent name={session.user.name} email={session.user.email} image={session.user.image} />;
}
