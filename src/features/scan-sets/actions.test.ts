import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const updateScanSetCore = vi.hoisted(() => vi.fn());
const getScanSetForRollCore = vi.hoisted(() => vi.fn());
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), updateScanSetCore, getScanSetForRollCore }));

import * as actions from "./actions";
import { updateScanSetAction } from "./actions";

const SET = "7f0c5b1e-3d2a-4c8e-9b1f-2a3b4c5d6e7f";

afterEach(() => vi.clearAllMocks());

describe("scan-set actions", () => {
  it("exports only async functions ('use server' module)", () => {
    for (const value of Object.values(actions)) expect(value).toBeInstanceOf(Function);
  });

  it("refuses a signed-out caller without touching the core", async () => {
    getSession.mockResolvedValue(null);
    expect(await updateScanSetAction({ scanSetId: SET })).toEqual({ ok: false, error: "not_found" });
    expect(updateScanSetCore).not.toHaveBeenCalled();
  });

  it("fires scan_set_saved once with whether a lab and a branch are set (D22)", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    updateScanSetCore.mockResolvedValue({ ok: true });
    await updateScanSetAction({ scanSetId: SET, labId: SET, labBranchId: null });
    expect(updateScanSetCore.mock.calls[0][1]).toBe("u1");
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: "u1",
      event: "scan_set_saved",
      properties: { has_lab: true, has_branch: false },
    });
  });

  it("fires nothing when the save fails", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    updateScanSetCore.mockResolvedValue({ ok: false, error: "invalid_lab" });
    await updateScanSetAction({ scanSetId: SET, labId: SET });
    expect(captureServerEvent).not.toHaveBeenCalled();
  });
});
