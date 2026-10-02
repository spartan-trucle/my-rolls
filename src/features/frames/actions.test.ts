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

const R1 = "11111111-1111-4111-8111-111111111111";
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

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
    await actions.setFramesMarksAction({ rollId: R1, frameIds: [A, B, C], mark: "blank", on: true, via: "key" });
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "frames_bulk_marked",
      properties: { mark: "blank", on: true, count: 3, via: "key" },
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/rolls/${R1}`);
  });

  it("bulk marks: a refused call emits nothing and doesn't revalidate", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.setFramesMarksCore.mockResolvedValue({ ok: false, error: "not_found" });
    await actions.setFramesMarksAction({ rollId: R1, frameIds: [A], mark: "keeper", on: true, via: "button" });
    expect(captureServerEvent).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown mark", { mark: "x" }],
    ["a truthy non-boolean on", { on: "yes" }],
    ["a string frameIds", { frameIds: A }],
    ["no frame ids", { frameIds: [] }],
    ["more than 500 frame ids", { frameIds: Array.from({ length: 501 }, () => A) }],
    ["a non-uuid frame id", { frameIds: ["a"] }],
    ["a non-uuid roll id", { rollId: "r1" }],
    ["an unknown via", { via: "mouse" }],
  ])("bulk marks: refuses %s without reaching the core", async (_, forged) => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const input = { rollId: R1, frameIds: [A], mark: "keeper", on: true, via: "button", ...forged };
    expect(await actions.setFramesMarksAction(input as never)).toEqual({ ok: false, error: "invalid_input" });
    expect(core.setFramesMarksCore).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });
});
