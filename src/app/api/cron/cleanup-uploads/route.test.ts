import { afterEach, describe, expect, it, vi } from "vitest";

const cleanupPendingFramesCore = vi.hoisted(() => vi.fn());

vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/r2", () => ({ deleteObjects: vi.fn() }));
vi.mock("@/features/uploads/cleanup", async (orig) => ({
  ...(await orig<typeof import("@/features/uploads/cleanup")>()),
  cleanupPendingFramesCore,
}));

import { GET } from "./route";

const get = (auth?: string) =>
  GET(new Request("http://localhost/api/cron/cleanup-uploads", { headers: auth ? { authorization: auth } : {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/cron/cleanup-uploads", () => {
  it("is 401 without the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await get()).status).toBe(401);
    expect((await get("Bearer nope")).status).toBe(401);
    expect(cleanupPendingFramesCore).not.toHaveBeenCalled();
  });

  it("runs the cleanup and reports how many frames went", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    cleanupPendingFramesCore.mockResolvedValue({ deleted: 3 });
    const res = await get("Bearer s3cret");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 3 });
  });
});
