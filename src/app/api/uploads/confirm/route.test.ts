import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const confirmFramesCore = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/features/uploads/core", async (orig) => ({
  ...(await orig<typeof import("@/features/uploads/core")>()),
  confirmFramesCore,
}));
vi.mock("@/lib/r2", () => ({ headObject: vi.fn() }));

import { POST } from "./route";

const ID = "7f0c5b1e-3d2a-4c8e-9b1f-2a3b4c5d6e7f";
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/uploads/confirm", { method: "POST", body: JSON.stringify(body) }));

afterEach(() => vi.clearAllMocks());

describe("POST /api/uploads/confirm", () => {
  it("is 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await post({ frameIds: [ID] })).status).toBe(401);
  });

  it("is 400 without frame ids", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    expect((await post({ frameIds: [] })).status).toBe(400);
  });

  it("returns the core's ready and missing lists", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    confirmFramesCore.mockResolvedValue({ ready: [ID], missing: [] });
    const res = await post({ frameIds: [ID] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ready: [ID], missing: [] });
    expect(confirmFramesCore.mock.calls[0][1]).toBe("u1");
  });
});
