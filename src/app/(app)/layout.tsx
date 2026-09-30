import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/AppShell";
import { getAuth } from "@/lib/auth";

/**
 * Shell for every route under `(app)/` (D18: `/bag`, `/rolls/new`,
 * `/rolls/[id]`, `/profile`, added on later branches). `/` itself stays a
 * top-level `page.tsx` (outside this group) since it has to branch between
 * the landing page and this shell depending on session — a shared layout
 * can't do that split.
 *
 * `proxy.ts`'s cookie check is only optimistic (Stage D): a signed-out
 * visitor never reaches here for a non-public path, but a stale cookie
 * still could, so this reads the real Better Auth session and redirects
 * home otherwise.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const initial = session.user.name.trim().charAt(0).toUpperCase() || "?";

  return <AppShell userInitial={initial}>{children}</AppShell>;
}
