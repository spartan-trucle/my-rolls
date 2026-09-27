import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { listBag } from "@/features/bag/queries";
import { POPULAR_CAMERA_SLUGS, POPULAR_STOCK_SLUGS } from "@/features/catalogue/popularSlugs";
import { getCatalogueBySlugs } from "@/features/catalogue/queries";
import type { ICameraChip, IStockChip } from "@/features/onboarding/types";
import { getAuth } from "@/lib/auth";
import { OnboardBagContent } from "./OnboardBagContent";

/**
 * F1 · `/onboarding/bag` (`OnboardBag` board): the curated camera and
 * film chips (`POPULAR_CAMERA_SLUGS` / `POPULAR_STOCK_SLUGS`), prefilled
 * checked from the caller's bag (`listBag`, BAG-1). Rendering and every
 * toggle/search/custom-entry interaction live in the client component
 * below — this page only does the one-time server read.
 */
export default async function OnboardBagPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const db = getDb();
  const [cameraEntries, stockEntries, bagEntries] = await Promise.all([
    getCatalogueBySlugs(db, { kind: "camera", slugs: POPULAR_CAMERA_SLUGS }),
    getCatalogueBySlugs(db, { kind: "stock", slugs: POPULAR_STOCK_SLUGS }),
    listBag(db, session.user.id),
  ]);

  const initialCameraChips: ICameraChip[] = cameraEntries
    .filter((entry) => entry.kind === "camera")
    .map((entry) => ({ kind: "camera", id: entry.id, brand: entry.brand, model: entry.model }));

  const initialStockChips: IStockChip[] = stockEntries
    .filter((entry) => entry.kind === "stock")
    .map((entry) => ({ kind: "stock", id: entry.id, brand: entry.brand, name: entry.name, canisterColor: entry.canisterColor }));

  const initialCheckedRefs: Record<string, string> = {};
  for (const item of bagEntries) {
    if (item.kind === "stock") initialCheckedRefs[`stock:${item.stock.id}`] = item.bagItemId;
    else if (item.kind === "camera") initialCheckedRefs[`camera:${item.camera.id}`] = item.bagItemId;
  }

  return (
    <OnboardBagContent
      initialCameraChips={initialCameraChips}
      initialStockChips={initialStockChips}
      initialCheckedRefs={initialCheckedRefs}
    />
  );
}
