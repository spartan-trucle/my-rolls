import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BagList } from "@/features/bag/components/BagList";
import { listBag } from "@/features/bag/queries";
import { getDb } from "@/db/client";
import { getAuth } from "@/lib/auth";

/**
 * D2 (BAG-1): `Profile`'s "Túi của tôi" plus `OnboardBag`'s picker (design
 * finding 1), inside `(app)/layout.tsx`'s `AppShell` (F3) — no nav built
 * here. That layout already redirects a signed-out visitor, but this
 * reads the session again to get `session.user.id` for `listBag`, and
 * redirects too as its own defense in depth (same pattern as
 * `sign-up/profile`'s page).
 */
export default async function BagPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  const entries = await listBag(getDb(), session.user.id);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <BagList initialEntries={entries} />
    </div>
  );
}
