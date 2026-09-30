import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuth } from "@/lib/auth";

/**
 * Shell for `/onboarding/bag` and `/onboarding/first-roll` (F1, Phase 0
 * D17): no `AppShell` — the `OnboardBag`/`OnboardFirst` boards have no
 * tab bar or app nav, so this route group stays a sibling of `(app)/`,
 * not nested inside it.
 *
 * `proxy.ts`'s cookie check is only optimistic (Stage D): a signed-out
 * visitor never reaches here for a non-public path, but a stale cookie
 * still could, so this reads the real Better Auth session and redirects
 * to `/sign-in` otherwise — same defense-in-depth as `(app)/layout.tsx`.
 */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return <>{children}</>;
}
