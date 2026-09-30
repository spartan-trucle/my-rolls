import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));
const fakeDb = vi.hoisted(() => ({ __brand: "fake-db" }));
const createRollCore = vi.hoisted(() => vi.fn());
const listRollsCore = vi.hoisted(() => vi.fn());
const getRollCore = vi.hoisted(() => vi.fn());
const captureServerEvent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));

vi.mock("@/db/client", () => ({
  getDb: vi.fn().mockReturnValue(fakeDb),
}));

vi.mock("@/lib/posthog-server", () => ({
  captureServerEvent,
}));

vi.mock("./core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./core")>();
  return {
    ...actual,
    createRollCore,
    listRollsCore,
    getRollCore,
  };
});

import * as actions from "./actions";
import { createRoll, getRoll, listRolls } from "./actions";

const USER_ID = "user-1";

describe("rolls actions module", () => {
  it("exports only async functions", () => {
    const exportNames = Object.keys(actions);

    expect(exportNames).toEqual(expect.arrayContaining(["createRoll", "listRolls", "getRoll"]));

    for (const name of exportNames) {
      const value = (actions as Record<string, unknown>)[name];
      expect(typeof value).toBe("function");
      expect(value?.constructor?.name).toBe("AsyncFunction");
    }
  });
});

describe("createRoll", () => {
  afterEach(() => {
    getSession.mockClear();
    createRollCore.mockClear();
    captureServerEvent.mockClear();
  });

  it("returns unauthenticated without touching the core when there's no session", async () => {
    getSession.mockResolvedValueOnce(null);

    const result = await createRoll({ mode: "new", stockId: "s1", cameraBagItemId: "c1" });

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(createRollCore).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("returns validation without touching the core when input fails zod parsing", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });

    const result = await createRoll({ mode: "new" });

    expect(result).toEqual({ ok: false, error: "validation" });
    expect(createRollCore).not.toHaveBeenCalled();
    expect(captureServerEvent).not.toHaveBeenCalled();
  });

  it("captures roll_created once on success, with mode and has_optional_details", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    createRollCore.mockResolvedValueOnce({ ok: true, rollId: "roll-1" });

    const result = await createRoll({
      mode: "new",
      stockId: "11111111-1111-4111-8111-111111111111",
      cameraBagItemId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result).toEqual({ ok: true, rollId: "roll-1" });
    expect(createRollCore).toHaveBeenCalledWith(fakeDb, USER_ID, expect.objectContaining({ mode: "new" }));
    expect(captureServerEvent).toHaveBeenCalledTimes(1);
    expect(captureServerEvent).toHaveBeenCalledWith({
      distinctId: USER_ID,
      event: "roll_created",
      properties: { mode: "new", has_optional_details: false },
    });
  });

  it("marks has_optional_details true once any optional field is filled", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    createRollCore.mockResolvedValueOnce({ ok: true, rollId: "roll-1" });

    await createRoll({
      mode: "new",
      stockId: "11111111-1111-4111-8111-111111111111",
      cameraBagItemId: "22222222-2222-4222-8222-222222222222",
      shotIso: 800,
    });

    expect(captureServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ properties: expect.objectContaining({ has_optional_details: true }) }),
    );
  });

  it("includes duration_ms when formOpenedAt is provided and non-negative", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    createRollCore.mockResolvedValueOnce({ ok: true, rollId: "roll-1" });
    const openedAt = Date.now() - 5000;

    await createRoll({
      mode: "new",
      stockId: "11111111-1111-4111-8111-111111111111",
      cameraBagItemId: "22222222-2222-4222-8222-222222222222",
      formOpenedAt: openedAt,
    });

    const call = captureServerEvent.mock.calls[0]?.[0];
    expect(call.properties.duration_ms).toBeGreaterThanOrEqual(5000);
  });

  it("omits duration_ms when formOpenedAt is missing", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    createRollCore.mockResolvedValueOnce({ ok: true, rollId: "roll-1" });

    await createRoll({
      mode: "new",
      stockId: "11111111-1111-4111-8111-111111111111",
      cameraBagItemId: "22222222-2222-4222-8222-222222222222",
    });

    const call = captureServerEvent.mock.calls[0]?.[0];
    expect(call.properties.duration_ms).toBeUndefined();
  });

  it("does not capture an event when the core returns a typed error", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    createRollCore.mockResolvedValueOnce({ ok: false, error: "not_found" });

    const result = await createRoll({
      mode: "new",
      stockId: "11111111-1111-4111-8111-111111111111",
      cameraBagItemId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(captureServerEvent).not.toHaveBeenCalled();
  });
});

describe("listRolls", () => {
  afterEach(() => {
    getSession.mockClear();
    listRollsCore.mockClear();
  });

  it("returns an empty list without touching the core when there's no session", async () => {
    getSession.mockResolvedValueOnce(null);

    const result = await listRolls();

    expect(result).toEqual([]);
    expect(listRollsCore).not.toHaveBeenCalled();
  });

  it("delegates to the core with the session's user id", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    listRollsCore.mockResolvedValueOnce([{ id: "roll-1" }]);

    const result = await listRolls();

    expect(result).toEqual([{ id: "roll-1" }]);
    expect(listRollsCore).toHaveBeenCalledWith(fakeDb, USER_ID);
  });
});

describe("getRoll", () => {
  afterEach(() => {
    getSession.mockClear();
    getRollCore.mockClear();
  });

  it("returns null without touching the core when there's no session", async () => {
    getSession.mockResolvedValueOnce(null);

    const result = await getRoll("roll-1");

    expect(result).toBeNull();
    expect(getRollCore).not.toHaveBeenCalled();
  });

  it("delegates to the core with the session's user id and rollId", async () => {
    getSession.mockResolvedValueOnce({ user: { id: USER_ID } });
    getRollCore.mockResolvedValueOnce({ id: "roll-1" });

    const result = await getRoll("roll-1");

    expect(result).toEqual({ id: "roll-1" });
    expect(getRollCore).toHaveBeenCalledWith(fakeDb, USER_ID, "roll-1");
  });
});
