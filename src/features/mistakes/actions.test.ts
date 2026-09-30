import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const setMistakesCore = vi.hoisted(() => vi.fn());
const listRollMistakesCore = vi.hoisted(() => vi.fn());
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), setMistakesCore, listRollMistakesCore }));

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
});
