import { describe, expect, it, vi } from "vitest";

const reportServerError = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/posthog-server", () => ({ reportServerError }));

import { onRequestError } from "./instrumentation";

describe("onRequestError", () => {
  it("reports the error with path and method from the request", async () => {
    const error = new Error("boom");
    const request = { path: "/api/dev/boom", method: "GET", headers: {} };
    const context = {
      routerKind: "App Router" as const,
      routePath: "/api/dev/boom",
      routeType: "route" as const,
      renderSource: undefined,
      revalidateReason: undefined,
    };

    await onRequestError(error, request, context);

    expect(reportServerError).toHaveBeenCalledWith(error, {
      path: "/api/dev/boom",
      method: "GET",
    });
  });

  it("awaits reportServerError so the function doesn't exit before the send", async () => {
    let resolved = false;
    reportServerError.mockImplementationOnce(async () => {
      await Promise.resolve();
      resolved = true;
    });

    await onRequestError(
      new Error("boom"),
      { path: "/x", method: "POST", headers: {} },
      {
        routerKind: "App Router" as const,
        routePath: "/x",
        routeType: "route" as const,
        renderSource: undefined,
        revalidateReason: undefined,
      },
    );

    expect(resolved).toBe(true);
  });
});
