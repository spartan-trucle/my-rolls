import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { OnboardFirstContent } from "./OnboardFirstContent";

/**
 * F1 · `/onboarding/first-roll` (`OnboardFirst` board), step 2 of 2: no
 * data to fetch — just the session guard (defense-in-depth against
 * `proxy.ts`'s optimistic cookie check) before rendering the mode choice.
 */
export default async function OnboardFirstPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return <OnboardFirstContent />;
}
