import type { Metadata } from "next";
import { ShareCard } from "./ShareCard";

export const metadata: Metadata = {
  title: "Spike: Web Share · Cuộn",
  robots: { index: false, follow: false },
};

/**
 * Spike 2 (D30): public, `noindex`. Device tests (iPhone Safari, Android
 * Chrome, and the Zalo/Messenger/Instagram in-app browsers) run on
 * production after this PR merges — those browsers can't pass Vercel
 * preview protection or Google sign-in. Results go in
 * `docs/spikes/web-share.md`.
 */
export default function SharePage() {
  return <ShareCard />;
}
