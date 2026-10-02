import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const setMistakesCore = vi.hoisted(() => vi.fn());
const addMistakesToFramesCore = vi.hoisted(() => vi.fn());
const revalidatePath = vi.hoisted(() => vi.fn());
const listRollMistakesCore = vi.hoisted(() => vi.fn());
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), setMistakesCore, listRollMistakesCore, addMistakesToFramesCore }));

import * as actions from "./actions";

afterEach(() => vi.clearAllMocks());

describe("mistake actions", () => {
  it("exports only async functions ('use server' module)", () => {
    for (const value of Object.values(actions)) expect(value).toBeInstanceOf(Function);
  });

  it("refuses a signed-out caller", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.setMistakesAction({ rollId: "r", frameId: null, items: [] })).toEqual({ ok: false, error: "not_found" });
  });

  it("fires mistake_tagged with the types and scope (D22)", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    setMistakesCore.mockResolvedValue({ ok: true });
    await actions.setMistakesAction({ rollId: "r", frameId: null, items: [{ type: "light_leak" }] });
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "mistake_tagged",
      properties: { on: "roll", types: ["light_leak"] },
    });
  });

  it("bulk oops: refuses a signed-out caller without calling the core", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.addMistakesToFramesAction({ rollId: "r", frameIds: ["a"], items: [{ type: "light_leak" }], via: "button" })).toEqual({
      ok: false,
      error: "not_found",
    });
    expect(addMistakesToFramesCore).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("bulk oops: one frames_bulk_marked event with the count, then revalidates the roll", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    addMistakesToFramesCore.mockResolvedValue({ ok: true });
    await actions.addMistakesToFramesAction({ rollId: "r1", frameIds: ["a", "b"], items: [{ type: "light_leak" }], via: "key" });
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "frames_bulk_marked",
      properties: { mark: "oops", on: true, count: 2, via: "key" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/rolls/r1");
  });

  it("bulk oops: a refused call emits nothing", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    addMistakesToFramesCore.mockResolvedValue({ ok: false, error: "invalid_input" });
    await actions.addMistakesToFramesAction({ rollId: "r1", frameIds: ["a"], items: [], via: "button" });
    expect(captureServerEvent).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
