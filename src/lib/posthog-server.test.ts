import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureExceptionImmediate = vi.fn().mockResolvedValue(undefined);
const shutdown = vi.fn().mockResolvedValue(undefined);

vi.mock("posthog-node", () => ({
  PostHog: vi.fn().mockImplementation(function PostHogMock(this: unknown) {
    return Object.assign(this as object, { captureExceptionImmediate, shutdown });
  }),
}));

describe("getPostHogServerClient", () => {
  beforeEach(() => {
    vi.resetModules();
    captureExceptionImmediate.mockClear();
    shutdown.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when NEXT_PUBLIC_POSTHOG_KEY is missing (local dev without the key must still run)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    const { getPostHogServerClient } = await import("./posthog-server");

    expect(getPostHogServerClient()).toBeNull();
  });

  it("returns the same memoized client on a second call", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { PostHog } = await import("posthog-node");
    const { getPostHogServerClient } = await import("./posthog-server");

    const first = getPostHogServerClient();
    const second = getPostHogServerClient();

    expect(first).toBe(second);
    expect(PostHog).toHaveBeenCalledTimes(1);
  });

  it("passes the NEXT_PUBLIC_POSTHOG_HOST config to the client", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { PostHog } = await import("posthog-node");
    const { getPostHogServerClient } = await import("./posthog-server");

    getPostHogServerClient();

    expect(PostHog).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        host: "https://us.i.posthog.com",
      }),
    );
  });
});

describe("reportServerError", () => {
  beforeEach(() => {
    vi.resetModules();
    captureExceptionImmediate.mockClear();
    shutdown.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops without throwing when the client is null (no key set)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    const { reportServerError } = await import("./posthog-server");

    await expect(
      reportServerError(new Error("boom"), { path: "/api/dev/boom", method: "GET" }),
    ).resolves.toBeUndefined();
    expect(captureExceptionImmediate).not.toHaveBeenCalled();
  });

  it("awaits captureExceptionImmediate with path and method, and does NOT call shutdown", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { reportServerError } = await import("./posthog-server");
    const error = new Error("boom");

    await reportServerError(error, { path: "/api/dev/boom", method: "GET" });

    expect(captureExceptionImmediate).toHaveBeenCalledWith(
      error,
      undefined,
      expect.objectContaining({ path: "/api/dev/boom", method: "GET" }),
    );
    expect(shutdown).not.toHaveBeenCalled();
  });
});
