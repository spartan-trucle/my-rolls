import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const core = vi.hoisted(() => ({
  saveNoteCore: vi.fn(),
  deleteNoteCore: vi.fn(),
  saveMemoryCore: vi.fn(),
  listRollNotesCore: vi.fn(),
}));
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({ getAuth: () => ({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent }));
vi.mock("./core", async (orig) => ({ ...(await orig<typeof import("./core")>()), ...core }));

import * as actions from "./actions";

afterEach(() => vi.clearAllMocks());

describe("note actions", () => {
  it("exports only async functions ('use server' module)", () => {
    for (const value of Object.values(actions)) expect(value).toBeInstanceOf(Function);
  });

  it("refuses a signed-out caller", async () => {
    getSession.mockResolvedValue(null);
    expect(await actions.saveNoteAction({ rollId: "r", body: "x" })).toEqual({ ok: false, error: "not_found" });
    expect(await actions.saveMemoryAction({ rollId: "r", memory: "x" })).toEqual({ ok: false, error: "not_found" });
  });

  it("fires note_saved only when a note is created, not on every autosave (D22)", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    core.saveNoteCore.mockResolvedValue({ ok: true, id: "n", updatedAt: new Date(), deleted: false });
    await actions.saveNoteAction({ rollId: "r", frameId: "f", body: "lọt sáng" });
    await actions.saveNoteAction({ noteId: "n", rollId: "r", body: "lọt sáng ở góc" });
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({ distinctId: "u1", event: "note_saved", properties: { on: "frame" } });
  });
});
