import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const getOriginalKeyCore = vi.hoisted(() => vi.fn());
const createPresignedDownloadUrl = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/features/uploads/core", async (orig) => ({
  ...(await orig<typeof import("@/features/uploads/core")>()),
  getOriginalKeyCore,
}));
vi.mock("@/lib/r2", () => ({ createPresignedDownloadUrl }));

import { GET } from "./route";

const ID = "7f0c5b1e-3d2a-4c8e-9b1f-2a3b4c5d6e7f";
const get = (id = ID) =>
  GET(new Request(`http://localhost/api/frames/${id}/original`), { params: Promise.resolve({ id }) });

afterEach(() => vi.clearAllMocks());

describe("GET /api/frames/[id]/original (D18)", () => {
  it("is 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it("redirects the owner to a short-lived signed url", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    getOriginalKeyCore.mockResolvedValue("originals/u1/x.jpg");
    createPresignedDownloadUrl.mockResolvedValue("https://signed/get");
    const res = await get();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://signed/get");
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(getOriginalKeyCore.mock.calls[0][1]).toBe("u1");
  });

  it("is 404 when the frame isn't the caller's, isn't ready, or the id is malformed", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    getOriginalKeyCore.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect((await get("not-a-uuid")).status).toBe(404);
    expect(createPresignedDownloadUrl).not.toHaveBeenCalled();
  });
});
