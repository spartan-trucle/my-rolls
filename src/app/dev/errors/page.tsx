import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorButton } from "./ErrorButton";

export const metadata: Metadata = {
  title: "Dev errors · Cuộn",
  robots: { index: false, follow: false },
};

/**
 * Test error triggers for the PostHog check (D29): one browser exception
 * (the button, autocaptured by `capture_exceptions`) and a link to
 * `/api/dev/boom`, a server error captured by `onRequestError`. Deleted in
 * the last commit of this branch, after the check passes. Hidden in
 * production, same as `/dev/design-system`.
 */
export default function DevErrorsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h1>Dev errors</h1>
      <p>Temporary triggers for the PostHog check (G1). Deleted once verified.</p>
      <ErrorButton />
      <a href="/api/dev/boom">/api/dev/boom (server error)</a>
    </main>
  );
}
