import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Design system · Cuộn",
  robots: { index: false, follow: false },
};

/** Paper and Darkroom side by side on wide screens, stacked on phones. Hidden in production. */
export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <main className="grid min-[1200px]:grid-cols-2">
      <div data-theme="light" className="rc-paper px-4 min-[600px]:px-6">
        <Showcase />
      </div>
      <div data-theme="dark" className="rc-paper px-4 min-[600px]:px-6">
        <Showcase />
      </div>
    </main>
  );
}
