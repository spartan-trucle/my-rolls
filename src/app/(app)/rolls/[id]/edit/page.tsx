import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoll } from "@/features/rolls/actions";
import { RollForm } from "@/features/rolls/components/RollForm";

export const metadata: Metadata = {
  title: "Sửa cuộn · Cuộn",
};

/**
 * R4: `/rolls/[id]/edit` — reuses `RollForm` in edit mode (its `roll`
 * prop). `getRoll` is already owner-scoped (D9), so a missing or another
 * user's roll both 404 here, same as `/rolls/[id]` itself.
 *
 * `mode` (new vs past) isn't stored on the roll — it only ever shaped
 * which fields the form asked for at create time. Picked here from
 * whatever dates the roll ended up with: any date at all (exact or
 * month-precision) means the past-mode month/year picker is the right
 * one to edit it with; no dates at all means it was logged as "loaded
 * now" and stays on the new-mode optional day pickers.
 */
export default async function EditRollPage({ params }: PageProps<"/rolls/[id]/edit">) {
  const { id } = await params;
  const roll = await getRoll(id);
  if (!roll) notFound();

  const mode = roll.shotFrom !== null || roll.datePrecision === "month" ? "past" : "new";

  return <RollForm mode={mode} roll={roll} />;
}
