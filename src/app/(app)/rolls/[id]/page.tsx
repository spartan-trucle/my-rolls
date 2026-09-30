import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoll } from "@/features/rolls/actions";
import { RollPage } from "@/features/rolls/components/RollPage";
import { listRollFramesAction } from "@/features/frames/actions";
import { getScanSetForRollAction } from "@/features/scan-sets/actions";

export const metadata: Metadata = {
  title: "Cuộn · Cuộn",
};

/**
 * D15: `/rolls/[id]` — `getRoll` is already owner-scoped (D9), so it
 * returns `null` both for a roll that doesn't exist and for one that
 * belongs to someone else; either way this 404s rather than leaking which
 * case it was.
 */
export default async function RollDetailPage({ params, searchParams }: PageProps<"/rolls/[id]">) {
  const { id } = await params;
  const roll = await getRoll(id);
  if (!roll) notFound();

  // R1: the "Đã lên kệ." banner shows only right after saving — the form
  // appends `?saved=1` to its own `router.push`, never present on a later
  // visit (a bookmark, Home's card link, back/forward).
  const query = await searchParams;
  const justSaved = query.saved === "1";

  const [scanSet, frames] = await Promise.all([getScanSetForRollAction(roll.id), listRollFramesAction(roll.id)]);

  return <RollPage roll={roll} justSaved={justSaved} openUpload={query.upload === "1"} scanSet={scanSet} frames={frames} />;
}
