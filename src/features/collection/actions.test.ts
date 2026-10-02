import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const core = vi.hoisted(() => ({ listLibraryCore: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/r2", () => ({ getR2Env: () => ({ R2_PUBLIC_URL: "https://img.example" }) }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), ...core }));

import * as actions from "./actions";

afterEach(() => vi.clearAllMocks());

describe("collection actions", () => {
  it("exports only async functions ('use server' module)", () => {
    for (const value of Object.values(actions)) expect(value).toBeInstanceOf(Function);
  });

  it("returns an empty page for a signed-out caller", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.listLibraryAction({ filter: "all" })).toEqual({
      totals: { rolls: 0, frames: 0, keepers: 0 },
      counts: { all: 0, keeper: 0, oops: 0 },
      groups: [],
      nextCursor: null,
    });
    expect(core.listLibraryCore).not.toHaveBeenCalled();
  });

  it("turns an unknown filter, even 'blank', into 'all' and passes the public url", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.listLibraryCore.mockResolvedValue({});
    await actions.listLibraryAction({ filter: "blank", cursor: "c" });
    expect(core.listLibraryCore.mock.calls[0].slice(1)).toEqual([
      "u1",
      { filter: "all", cursor: "c", publicUrl: "https://img.example" },
    ]);
  });
});
