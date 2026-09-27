import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getProfileSummary } from "@/features/bag/queries";
import { getAuth } from "@/lib/auth";
import { ProfileContent } from "./ProfileContent";

/**
 * `/profile` (F4, Phase 0 D18): reads the real session server-side —
 * `proxy.ts`'s cookie check is only optimistic, and `/profile` isn't in
 * its public paths, so a signed-out request is already redirected there
 * before this ever runs. This second check is defensive (matches
 * `/sign-up/profile`'s own page).
 *
 * Round 2 (PR1/PR3/PR4): also reads `getProfileSummary` (roll count,
 * "Túi của tôi" preview) straight from `queries.ts`, the same pattern
 * `/bag`'s page uses for `listBag` — no extra Server Action round trip
 * needed for a page's own initial render.
 */
export default async function ProfilePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  const summary = await getProfileSummary(getDb(), session.user.id);

  return (
    <ProfileContent
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
      createdAt={session.user.createdAt}
      summary={summary}
    />
  );
}
