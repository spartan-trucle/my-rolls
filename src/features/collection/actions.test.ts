import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const core = vi.hoisted(() => ({ listLibraryCore: vi.fn(), libraryTotalsCore: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
const cookieJar = vi.hoisted(() => ({ set: vi.fn() }));
const captureServerEvent = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}), cookies: vi.fn(async () => cookieJar) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
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

  it.each([
    ["a non-string cursor", { filter: "all", cursor: { id: 1 } }],
    ["a non-string filter", { filter: ["keeper"] }],
    ["no input at all", undefined],
  ])("returns the empty page for %s without reaching the core", async (_, forged) => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    expect(await actions.listLibraryAction(forged as never)).toEqual({
      totals: { rolls: 0, frames: 0, keepers: 0 },
      counts: { all: 0, keeper: 0, oops: 0 },
      groups: [],
      nextCursor: null,
    });
    expect(core.listLibraryCore).not.toHaveBeenCalled();
  });

  describe("libraryTotalsAction (Ruling R8)", () => {
    it("returns zeros for a signed-out caller", async () => {
      getSession.mockResolvedValue(null);
      expect(await actions.libraryTotalsAction()).toEqual({ rolls: 0, frames: 0, keepers: 0 });
      expect(core.libraryTotalsCore).not.toHaveBeenCalled();
    });

    it("returns the signed-in user's totals", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      core.libraryTotalsCore.mockResolvedValue({ rolls: 3, frames: 108, keepers: 16 });
      expect(await actions.libraryTotalsAction()).toEqual({ rolls: 3, frames: 108, keepers: 16 });
      expect(core.libraryTotalsCore.mock.calls[0][1]).toBe("u1");
    });
  });

  describe("rememberViewAction (plan D7, D17)", () => {
    const YEAR = 60 * 60 * 24 * 365;

    it("does nothing for a signed-out caller", async () => {
      getSession.mockResolvedValue(null);
      await actions.rememberViewAction({ surface: "library", view: "grid" });
      expect(cookieJar.set).not.toHaveBeenCalled();
      expect(captureServerEvent).not.toHaveBeenCalled();
    });

    it("remembers the library view for a year and emits view_switched", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      await actions.rememberViewAction({ surface: "library", view: "grid" });
      expect(cookieJar.set).toHaveBeenCalledWith("cuon_library_view", "grid", {
        maxAge: YEAR,
        sameSite: "lax",
        path: "/",
        httpOnly: true,
      });
      expect(captureServerEvent).toHaveBeenCalledWith({
        distinctId: "u1",
        event: "view_switched",
        properties: { surface: "library", view: "grid" },
      });
    });

    it("remembers the roll view in its own cookie", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      await actions.rememberViewAction({ surface: "roll", view: "grid" });
      expect(cookieJar.set.mock.calls[0].slice(0, 2)).toEqual(["cuon_roll_view", "grid"]);
    });

    it("stores the default instead of a forged view", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      await actions.rememberViewAction({ surface: "roll", view: "<script>" });
      expect(cookieJar.set.mock.calls[0].slice(0, 2)).toEqual(["cuon_roll_view", "strip"]);
      expect(captureServerEvent.mock.calls[0][0].properties).toEqual({ surface: "roll", view: "strip" });
    });

    it.each([
      ["a non-string view", { surface: "roll", view: ["grid"] }],
      ["a non-string surface", { surface: 1, view: "grid" }],
      ["no input at all", undefined],
    ])("ignores %s", async (_, forged) => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      await actions.rememberViewAction(forged as never);
      expect(cookieJar.set).not.toHaveBeenCalled();
      expect(captureServerEvent).not.toHaveBeenCalled();
    });

    it("treats an unknown surface as the library", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      await actions.rememberViewAction({ surface: "nope" as "library", view: "shelf" });
      expect(cookieJar.set.mock.calls[0].slice(0, 2)).toEqual(["cuon_library_view", "shelf"]);
      expect(captureServerEvent.mock.calls[0][0].properties).toEqual({ surface: "library", view: "shelf" });
    });
  });
});
