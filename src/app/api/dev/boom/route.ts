/**
 * Test error trigger for the PostHog check (D29): always throws, so Next's
 * `onRequestError` (`src/instrumentation.ts`) captures it as a server
 * `$exception`. Public under `/api/dev` (`proxy-decision.ts`). Deleted in
 * the last commit of this branch, after the check passes.
 */
export async function GET() {
  throw new Error("Cuộn /api/dev/boom: thrown on the server");
}
