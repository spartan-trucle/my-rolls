import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listRollFramesAction } from "@/features/frames/actions";
import { FrameView } from "@/features/frames/components/FrameView";
import { getRoll } from "@/features/rolls/actions";

export const metadata: Metadata = {
  title: "Cuộn",
};

/** Phase 2 plan D21: `FrameView` for one of the caller's frames; anything else is a 404. */
export default async function FramePage({ params }: PageProps<"/rolls/[id]/frames/[frameId]">) {
  const { id, frameId } = await params;
  const roll = await getRoll(id);
  if (!roll) notFound();

  const frames = await listRollFramesAction(roll.id);
  const index = frames.findIndex((f) => f.id === frameId);
  if (index === -1) notFound();

  const t = await getTranslations("rolls.page");
  const rollLabel = roll.name ?? (roll.number != null ? t("titleFallback", { number: roll.number }) : t("detailFilm"));

  return <FrameView rollId={roll.id} rollLabel={rollLabel} frames={frames} index={index} />;
}
