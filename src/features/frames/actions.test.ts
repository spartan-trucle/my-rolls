import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const core = vi.hoisted(() => ({
  setFrameMarksCore: vi.fn(),
  setFramesMarksCore: vi.fn(),
  moveFrameCore: vi.fn(),
  deleteFrameCore: vi.fn(),
  restoreFrameCore: vi.fn(),
  listRollFramesCore: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
vi.mock("@/lib/r2", () => ({ getR2Env: () => ({ R2_PUBLIC_URL: "https://img.example" }) }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), ...core }));

import * as actions from "./actions";

afterEach(() => vi.clearAllMocks());

describe("frame actions", () => {
  it("exports only async functions ('use server' module)", () => {
    for (const value of Object.values(actions)) expect(value).toBeInstanceOf(Function);
  });

  it("refuses a signed-out caller", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.setFrameMarksAction({ frameId: "f", isKeeper: true })).toEqual({ ok: false, error: "not_found" });
    expect(await actions.listRollFramesAction("r")).toEqual([]);
    expect(core.setFrameMarksCore).not.toHaveBeenCalled();
  });

  it("fires frame_marked with the mark that changed (D22)", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.setFrameMarksCore.mockResolvedValue({ ok: true });
    await actions.setFrameMarksAction({ frameId: "f", isKeeper: true });
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "frame_marked",
      properties: { mark: "keeper", on: true },
    });
  });

  it("passes the public copy url to the frame list", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.listRollFramesCore.mockResolvedValue([]);
    await actions.listRollFramesAction("r");
    expect(core.listRollFramesCore.mock.calls[0].slice(1)).toEqual(["u1", "r", { publicUrl: "https://img.example" }]);
  });

  it("bulk marks: refuses a signed-out caller without calling the core", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.setFramesMarksAction({ rollId: "r", frameIds: ["a"], mark: "keeper", on: true, via: "button" })).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(core.setFramesMarksCore).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("bulk marks: one frames_bulk_marked event with the count, then revalidates the roll", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.setFramesMarksCore.mockResolvedValue({ ok: true });
    await actions.setFramesMarksAction({ rollId: "r1", frameIds: ["a", "b", "c"], mark: "blank", on: true, via: "key" });
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "frames_bulk_marked",
      properties: { mark: "blank", on: true, count: 3, via: "key" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/rolls/r1");
  });

  it("bulk marks: a refused call emits nothing and doesn't revalidate", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.setFramesMarksCore.mockResolvedValue({ ok: false, error: "not_found" });
    await actions.setFramesMarksAction({ rollId: "r1", frameIds: ["a"], mark: "keeper", on: true, via: "button" });
    expect(captureServerEvent).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
