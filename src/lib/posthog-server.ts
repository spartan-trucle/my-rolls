import "server-only";

import { PostHog } from "posthog-node";

export interface IServerErrorContext {
  /** Resource path, e.g. `/api/dev/boom` (Next's `onRequestError` `request.path`). */
  path: string;
  /** Request method, e.g. `GET`, `POST`. */
  method: string;
}

let cachedClient: PostHog | null | undefined;

/**
 * Memoized `posthog-node` client for server-side error capture (D27). Same
 * public project token as the browser (`instrumentation-client.ts`) — no
 * new secret. Sends every event immediately because a serverless function
 * can exit right after `onRequestError` returns.
 *
 * Returns `null` when `NEXT_PUBLIC_POSTHOG_KEY` isn't set, so local dev
 * without the key still runs (no throw).
 */
export function getPostHogServerClient(): PostHog | null {
  if (cachedClient !== undefined) return cachedClient;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return cachedClient;
}

/**
 * Reports a server-side error to PostHog and waits for it to send before
 * returning (D27) — `instrumentation.ts`'s `onRequestError` must await this
 * so the function doesn't exit before the event leaves the process. Uses
 * `captureExceptionImmediate` instead of `captureException` + `shutdown()`
 * because `shutdown()` closes the reused client (incompatible with Vercel's
 * instance reuse). No `distinctId`: Phase 0 never identifies users (D28),
 * so every server exception is anonymous, same as the browser ones.
 */
export async function reportServerError(error: unknown, context: IServerErrorContext): Promise<void> {
  const client = getPostHogServerClient();
  if (!client) return;

  await client.captureExceptionImmediate(error, undefined, context);
}

export interface IServerEvent {
  /** The identified user's id (Better Auth `user.id`) — never anonymous, unlike `reportServerError`'s exceptions. */
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Captures a server-side product event (D16: `roll_created`) and waits
 * for it to send, same reasoning as `reportServerError` — a serverless
 * function can exit right after the Server Action returns, so this must
 * be awaited by the caller rather than fired and forgotten.
 *
 * Never throws: a capture failure (network, PostHog outage, missing key)
 * must never fail the action it's attached to, so any error here is
 * swallowed after the attempt.
 */
export async function captureServerEvent(input: IServerEvent): Promise<void> {
  const client = getPostHogServerClient();
  if (!client) return;

  try {
    await client.captureImmediate({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties,
    });
  } catch {
    // Swallowed on purpose (D16): analytics must never fail the caller.
  }
}
