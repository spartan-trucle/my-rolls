import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const requestSlotsCore = vi.hoisted(() => vi.fn());
const fakeDb = vi.hoisted(() => ({ __brand: "db" }));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("@/db/client", () => ({ getDb: () => fakeDb }));
vi.mock("@/features/uploads/core", async (orig) => ({
  ...(await orig<typeof import("@/features/uploads/core")>()),
  requestSlotsCore,
}));
vi.mock("@/lib/r2", () => ({ presignPut: vi.fn() }));

import { POST } from "./route";

const ROLL = "7f0c5b1e-3d2a-4c8e-9b1f-2a3b4c5d6e7f";
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/uploads/slots", { method: "POST", body: JSON.stringify(body) }));

afterEach(() => vi.clearAllMocks());

describe("POST /api/uploads/slots", () => {
  it("is 401 without a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await post({ rollId: ROLL, files: [{}] })).status).toBe(401);
    expect(requestSlotsCore).not.toHaveBeenCalled();
  });

  it("is 400 for a body that isn't a roll id and a file list", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    expect((await post({ rollId: "nope", files: [] })).status).toBe(400);
  });

  it("passes the caller's id to the core and returns its slots", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    requestSlotsCore.mockResolvedValue({ ok: true, scanSetId: "s1", slots: [] });
    const res = await post({ rollId: ROLL, files: [{ clientId: "c1" }] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scanSetId: "s1", slots: [] });
    expect(requestSlotsCore.mock.calls[0][0]).toBe(fakeDb);
    expect(requestSlotsCore.mock.calls[0][1]).toBe("u1");
  });

  it.each([
    [{ ok: false, error: "not_found" }, 404],
    [{ ok: false, error: "too_many" }, 400],
    [{ ok: false, error: "invalid_file", clientId: "c2" }, 400],
  ])("maps %o to %i", async (result, status) => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    requestSlotsCore.mockResolvedValue(result);
    const res = await post({ rollId: ROLL, files: [{ clientId: "c1" }] });
    expect(res.status).toBe(status);
    expect(await res.json()).toMatchObject({ error: result.error });
  });
});
