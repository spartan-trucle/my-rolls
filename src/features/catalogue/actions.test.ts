import { describe, expect, it } from "vitest";
import * as actions from "./actions";

/**
 * `actions.ts` carries a file-level `"use server"` directive, and
 * Next.js requires every export of such a module to be an async
 * function — a non-function export (a schema, a type re-export used as a
 * value, …) breaks the build. This guards that rule directly, rather
 * than only relying on `next build` to catch a regression.
 */
describe("catalogue actions module", () => {
  it("exports only async functions", () => {
    const exportNames = Object.keys(actions);

    expect(exportNames).toEqual(
      expect.arrayContaining(["addCustomStock", "addCustomCamera", "addCustomLens"]),
    );

    for (const name of exportNames) {
      const value = (actions as Record<string, unknown>)[name];
      expect(typeof value).toBe("function");
      expect(value?.constructor?.name).toBe("AsyncFunction");
    }
  });
});
