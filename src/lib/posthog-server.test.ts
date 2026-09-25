import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();
const shutdown = vi.fn().mockResolvedValue(undefined);

vi.mock("posthog-node", () => ({
  PostHog: vi.fn().mockImplementation(function PostHogMock(this: unknown) {
    return Object.assign(this as object, { captureException, shutdown });
  }),
}));

describe("getPostHogServerClient", () => {
  beforeEach(() => {
    vi.resetModules();
    captureException.mockClear();
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

  it("configures flushAt: 1 and flushInterval: 0 so an error is sent before the function exits", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { PostHog } = await import("posthog-node");
    const { getPostHogServerClient } = await import("./posthog-server");

    getPostHogServerClient();

    expect(PostHog).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        host: "https://us.i.posthog.com",
        flushAt: 1,
        flushInterval: 0,
      }),
    );
  });
});

describe("reportServerError", () => {
  beforeEach(() => {
    vi.resetModules();
    captureException.mockClear();
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
    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures the error with path and method, then awaits shutdown", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    const { reportServerError } = await import("./posthog-server");
    const error = new Error("boom");

    await reportServerError(error, { path: "/api/dev/boom", method: "GET" });

    expect(captureException).toHaveBeenCalledWith(
      error,
      undefined,
      expect.objectContaining({ path: "/api/dev/boom", method: "GET" }),
    );
    expect(shutdown).toHaveBeenCalledTimes(1);
  });
});
