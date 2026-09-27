import posthog from "posthog-js";

/**
 * Browser analytics and error tracking (D26), Next 15.3+ convention — no
 * provider component, this file's own top-level code runs once before
 * hydration. `capture_pageview: "history_change"` covers App Router
 * client-side navigations, not just full loads. `capture_exceptions: true`
 * turns on exception autocapture in code (the PostHog project itself has
 * it off — see the roadmap Progress note). `person_profiles:
 * "identified_only"` with no `identify()` call anywhere in Phase 0 (D28)
 * means every event stays anonymous. Session recording stays off.
 *
 * No-ops when `NEXT_PUBLIC_POSTHOG_KEY` isn't set, so local dev without the
 * key still runs. No reverse proxy yet, so ad blockers will drop some
 * events — fine for soft launch.
 */
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: "history_change",
    capture_exceptions: true,
    person_profiles: "identified_only",
    disable_session_recording: true,
  });
}
