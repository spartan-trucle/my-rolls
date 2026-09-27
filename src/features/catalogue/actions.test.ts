import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const searchCatalogueQuery = vi.hoisted(() => vi.fn());
const getCatalogueBySlugsQuery = vi.hoisted(() => vi.fn());
const getDb = vi.hoisted(() => vi.fn().mockReturnValue({ __brand: "fake-db" }));
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({ getAuth: vi.fn().mockReturnValue({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(fakeRequestHeaders) }));
vi.mock("@/db/client", () => ({ getDb }));
vi.mock("@/features/catalogue/queries", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  searchCatalogue: searchCatalogueQuery,
  getCatalogueBySlugs: getCatalogueBySlugsQuery,
}));

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
      expect.arrayContaining([
        "addCustomStock",
        "addCustomCamera",
        "addCustomLens",
        "searchCatalogue",
        "getCatalogueBySlugs",
      ]),
    );

    for (const name of exportNames) {
      const value = (actions as Record<string, unknown>)[name];
      expect(typeof value).toBe("function");
      expect(value?.constructor?.name).toBe("AsyncFunction");
    }
  });
});

describe("searchCatalogue action", () => {
  afterEach(() => {
    getSession.mockReset();
    searchCatalogueQuery.mockReset();
  });

  it("rejects an unauthenticated caller without querying the catalogue", async () => {
    getSession.mockResolvedValue(null);

    const result = await actions.searchCatalogue({ kind: "stock", q: "gold" });

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(searchCatalogueQuery).not.toHaveBeenCalled();
  });

  it("passes the session's userId and the given kind/q through to the query", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    searchCatalogueQuery.mockResolvedValue([{ kind: "stock", id: "s1" }]);

    const result = await actions.searchCatalogue({ kind: "stock", q: "gold" });

    expect(searchCatalogueQuery).toHaveBeenCalledWith(
      { __brand: "fake-db" },
      { kind: "stock", q: "gold", userId: "user-1" },
    );
    expect(result).toEqual({ ok: true, entries: [{ kind: "stock", id: "s1" }] });
  });
});

describe("getCatalogueBySlugs action", () => {
  afterEach(() => {
    getSession.mockReset();
    getCatalogueBySlugsQuery.mockReset();
  });

  it("rejects an unauthenticated caller without querying the catalogue", async () => {
    getSession.mockResolvedValue(null);

    const result = await actions.getCatalogueBySlugs({ kind: "camera", slugs: ["pentax-k1000"] });

    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(getCatalogueBySlugsQuery).not.toHaveBeenCalled();
  });

  it("passes the kind/slugs through to the query", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    getCatalogueBySlugsQuery.mockResolvedValue([{ kind: "camera", id: "cam-1" }]);

    const result = await actions.getCatalogueBySlugs({ kind: "camera", slugs: ["pentax-k1000"] });

    expect(getCatalogueBySlugsQuery).toHaveBeenCalledWith(
      { __brand: "fake-db" },
      { kind: "camera", slugs: ["pentax-k1000"] },
    );
    expect(result).toEqual({ ok: true, entries: [{ kind: "camera", id: "cam-1" }] });
  });
});
