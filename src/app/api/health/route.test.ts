import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(),
}));

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { GET, pingDatabase } from "./route";

/**
 * `neon(...)` returns a `NeonQueryFunction`, which carries `query`,
 * `unsafe` and `transaction` members our route never uses. A plain
 * `vi.fn()` covers the tagged-template call `pingDatabase` actually makes;
 * this cast tells TypeScript that's an intentional, minimal test double.
 */
function fakeSql(
  impl: (...args: unknown[]) => Promise<unknown>,
): NeonQueryFunction<boolean, boolean> {
  return vi.fn(impl) as unknown as NeonQueryFunction<boolean, boolean>;
}

describe("pingDatabase", () => {
  it("resolves true when `select 1` succeeds", async () => {
    const sql = vi.fn().mockResolvedValue([{ "?column?": 1 }]);

    await expect(pingDatabase(sql)).resolves.toBe(true);
    expect(sql).toHaveBeenCalledOnce();
  });

  it("rejects when the query throws", async () => {
    const sql = vi.fn().mockRejectedValue(new Error("connection refused"));

    await expect(pingDatabase(sql)).rejects.toThrow("connection refused");
  });
});

describe("GET /api/health", () => {
  beforeEach(() => {
    // `GET` calls `getEnv()`, which validates `process.env` on first use.
    // Stub the keys it needs; `route.ts` doesn't read them otherwise.
    vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost:5432/test");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-only-placeholder-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-only-google-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-only-google-client-secret");
  });

  afterEach(() => {
    vi.mocked(neon).mockReset();
    vi.unstubAllEnvs();
  });

  it("returns 200 with db up when the ping succeeds", async () => {
    vi.mocked(neon).mockReturnValue(
      fakeSql(() => Promise.resolve([{ "?column?": 1 }])),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, db: "up" });
  });

  it("returns 503 with db down when the ping throws", async () => {
    vi.mocked(neon).mockReturnValue(
      fakeSql(() => Promise.reject(new Error("connection refused"))),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, db: "down" });
  });
});
