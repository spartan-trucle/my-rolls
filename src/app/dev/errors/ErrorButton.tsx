"use client";

/**
 * Throws synchronously in an event handler, so `capture_exceptions` in
 * `instrumentation-client.ts` (D26) autocaptures it as a browser `$exception`.
 * Temporary — this page is deleted once the PostHog check (D29) passes.
 */
export function ErrorButton() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("Cuộn dev/errors: thrown in the browser");
      }}
    >
      Throw in browser
    </button>
  );
}
