import type { Metadata } from "next";
import { RollForm } from "@/features/rolls/components/RollForm";

export const metadata: Metadata = {
  title: "Cuộn mới · Cuộn",
};

/**
 * D3, D18: `/rolls/new` and `/rolls/new?mode=past` — the `(app)` layout
 * already checks the session and redirects a signed-out visitor (D19), so
 * this page only has to read the mode and hand off to `RollForm`.
 */
export default async function NewRollPage({ searchParams }: PageProps<"/rolls/new">) {
  const params = await searchParams;
  const mode = params.mode === "past" ? "past" : "new";

  return <RollForm mode={mode} />;
}
