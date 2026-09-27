import { describe, expect, it, vi } from "vitest";

const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession: vi.fn() } }),
}));
vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

import * as actions from "./actions";

/**
 * `actions.ts` carries a file-level `"use server"` (not per-function),
 * because F2's lab picker (a client component) imports it — Next only
 * allows the directive at the top of a whole module in that case, and
 * requires every export from such a module to be an async function. This
 * guards that shape directly, so a future export that isn't one (a
 * constant, a type re-export that survives to runtime, a sync helper)
 * fails a test instead of only failing Next's build.
 */
describe("actions.ts (B5): every export is an async function", () => {
  it("has at least one export", () => {
    expect(Object.keys(actions).length).toBeGreaterThan(0);
  });

  for (const [name, value] of Object.entries(actions)) {
    it(`${name} is an async function`, () => {
      expect(typeof value).toBe("function");
      expect(value?.constructor?.name).toBe("AsyncFunction");
    });
  }
});
