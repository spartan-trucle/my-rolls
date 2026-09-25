import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({ default: { init } }));

describe("instrumentation-client", () => {
  beforeEach(() => {
    vi.resetModules();
    init.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not call posthog.init when NEXT_PUBLIC_POSTHOG_KEY is missing (local dev without the key must still run)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    await import("./instrumentation-client");

    expect(init).not.toHaveBeenCalled();
  });

  it("initializes with the D26 config when the key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    await import("./instrumentation-client");

    expect(init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        api_host: "https://us.i.posthog.com",
        capture_pageview: "history_change",
        capture_exceptions: true,
        person_profiles: "identified_only",
        disable_session_recording: true,
      }),
    );
  });
});
