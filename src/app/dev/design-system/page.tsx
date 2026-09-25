import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Design system · Cuộn",
  robots: { index: false, follow: false },
};

/** Paper and Darkroom side by side on wide screens, stacked on phones. Hidden in production. */
export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <>
      <header className="flex items-center justify-between border-b border-line px-4 py-4 min-[600px]:px-6">
        <span className="font-mono text-meta uppercase text-ink-muted">Design system · Cuộn</span>
        <ThemeToggle />
      </header>
      <main className="grid grid-cols-1 min-[1200px]:grid-cols-2">
        <div data-theme="light" className="rc-paper px-4 min-[600px]:px-6">
          <Showcase />
        </div>
        <div data-theme="dark" className="rc-paper px-4 min-[600px]:px-6">
          <Showcase />
        </div>
      </main>
    </>
  );
}
