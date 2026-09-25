import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { ProfileContent } from "./ProfileContent";

/**
 * Signup step 2 (D18): reads the real session server-side (the proxy's
 * cookie check is only optimistic) — no session, no page. `newUserCallbackURL`
 * (Stage D's `getAuth()`) sends first-time Google sign-ins here directly.
 * Rendering itself lives in `ProfileContent` (client: `useActionState`).
 */
export default async function SignUpProfilePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  return <ProfileContent name={session.user.name} email={session.user.email} image={session.user.image} />;
}
