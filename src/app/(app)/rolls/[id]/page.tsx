import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRoll } from "@/features/rolls/actions";
import { RollPage } from "@/features/rolls/components/RollPage";

export const metadata: Metadata = {
  title: "Cuộn · Cuộn",
};

/**
 * D15: `/rolls/[id]` — `getRoll` is already owner-scoped (D9), so it
 * returns `null` both for a roll that doesn't exist and for one that
 * belongs to someone else; either way this 404s rather than leaking which
 * case it was.
 */
export default async function RollDetailPage({ params }: PageProps<"/rolls/[id]">) {
  const { id } = await params;
  const roll = await getRoll(id);
  if (!roll) notFound();

  return <RollPage roll={roll} />;
}
