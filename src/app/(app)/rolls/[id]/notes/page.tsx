import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listRollNotesAction } from "@/features/notes/actions";
import { NotesMemory } from "@/features/notes/components/NotesMemory";
import { getRoll } from "@/features/rolls/actions";

export const metadata: Metadata = {
  title: "Cuộn",
};

/** NOTE-1: the `NotesMemory` board for one of the caller's rolls. */
export default async function NotesPage({ params }: PageProps<"/rolls/[id]/notes">) {
  const { id } = await params;
  const roll = await getRoll(id);
  if (!roll) notFound();

  const notes = await listRollNotesAction(roll.id);
  const t = await getTranslations("rolls.page");
  const rollTitle = roll.name ?? (roll.number != null ? t("titleFallback", { number: roll.number }) : t("detailFilm"));

  return <NotesMemory rollId={roll.id} rollTitle={rollTitle} memory={roll.memory} notes={notes} />;
}
