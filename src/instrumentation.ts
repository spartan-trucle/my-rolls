import type { Instrumentation } from "next";

import { reportServerError } from "@/lib/posthog-server";

/**
 * Next's server-error hook (D27): every server-side error (Server
 * Components, route handlers, server actions) lands here. Forwards to
 * PostHog with the request's path and method so errors group sensibly,
 * then awaits the send — see `reportServerError`'s own comment for why.
 * No-ops (via `reportServerError`) when `NEXT_PUBLIC_POSTHOG_KEY` isn't
 * set, so local dev without the key still runs.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  await reportServerError(error, { path: request.path, method: request.method });
};
