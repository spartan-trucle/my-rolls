import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { CataloguePreview } from "./CataloguePreview";

export const metadata: Metadata = {
  title: "Danh mục · Cuộn",
  robots: { index: false, follow: false },
};

/** D1: try `CataloguePicker` and `CustomEntryForm` ahead of D2/D3. Hidden in production, like `/dev/design-system`. */
export default function CataloguePage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <>
      <header className="flex items-center justify-between border-b border-line px-4 py-4 min-[600px]:px-6">
        <span className="font-mono text-meta uppercase text-ink-muted">Danh mục · Cuộn</span>
        <ThemeToggle />
      </header>
      <main>
        <CataloguePreview />
      </main>
    </>
  );
}
