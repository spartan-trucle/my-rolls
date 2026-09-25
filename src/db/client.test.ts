import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pg", () => ({
  Pool: vi.fn(function FakePool(this: { __brand: string; options: unknown }, options: unknown) {
    this.__brand = "fake-pool";
    this.options = options;
  }),
}));

vi.mock("@vercel/functions", () => ({
  attachDatabasePool: vi.fn(),
}));

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn().mockReturnValue({ __brand: "fake-db" }),
}));

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

describe("getDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "postgres://pooled/db");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-only-placeholder-secret");
    vi.mocked(Pool).mockClear();
    vi.mocked(attachDatabasePool).mockClear();
    vi.mocked(drizzle).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates the pool with the pooled DATABASE_URL, not DATABASE_URL_UNPOOLED", async () => {
    const { getDb } = await import("./client");

    getDb();

    expect(Pool).toHaveBeenCalledWith({ connectionString: "postgres://pooled/db" });
  });

  it("attaches the pool so Vercel keeps the instance alive for idle connections", async () => {
    const { getDb } = await import("./client");

    getDb();

    expect(attachDatabasePool).toHaveBeenCalledOnce();
    expect(attachDatabasePool).toHaveBeenCalledWith(
      expect.objectContaining({ __brand: "fake-pool" }),
    );
  });

  it("builds the Drizzle instance from the pool and the schema", async () => {
    const { getDb } = await import("./client");

    getDb();

    expect(drizzle).toHaveBeenCalledWith(
      expect.objectContaining({ __brand: "fake-pool" }),
      expect.objectContaining({ schema: expect.any(Object) }),
    );
  });

  it("does not create a pool until getDb() is called", async () => {
    await import("./client");

    expect(Pool).not.toHaveBeenCalled();
  });

  it("returns the same db instance on a second call and does not re-create the pool", async () => {
    const { getDb } = await import("./client");

    const first = getDb();
    const second = getDb();

    expect(second).toBe(first);
    expect(Pool).toHaveBeenCalledTimes(1);
  });
});
