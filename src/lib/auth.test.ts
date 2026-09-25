import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({
  getDb: vi.fn().mockReturnValue({ __brand: "fake-db" }),
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn().mockReturnValue(() => ({ __brand: "fake-db-adapter" })),
}));

const validEnv = {
  DATABASE_URL: "postgres://pooled/db",
  BETTER_AUTH_SECRET: "test-only-placeholder-secret",
  GOOGLE_CLIENT_ID: "test-only-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-only-google-client-secret",
};

function stubValidEnv() {
  for (const [key, value] of Object.entries(validEnv)) vi.stubEnv(key, value);
}

/**
 * Tests the config `getAuth()` builds, not Better Auth's own behaviour —
 * these never hit Google or a real database ("assert config, don't hit
 * Google"). `@/db/client` is mocked so `drizzleAdapter` gets a plain
 * object instead of a real `pg.Pool`.
 */
describe("getAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    stubValidEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps sessions for 30 days with a 1-day refresh window (AUTH-1)", async () => {
    const { getAuth } = await import("./auth");
    const auth = getAuth();

    expect(auth.options.session?.expiresIn).toBe(60 * 60 * 24 * 30);
    expect(auth.options.session?.updateAge).toBe(60 * 60 * 24);
  });

  it("configures the Google provider from env with no mapping override, so Better Auth's default name/email/image mapping applies", async () => {
    const { getAuth } = await import("./auth");
    const auth = getAuth();

    expect(auth.options.socialProviders?.google).toEqual({
      clientId: validEnv.GOOGLE_CLIENT_ID,
      clientSecret: validEnv.GOOGLE_CLIENT_SECRET,
    });
  });

  it("trusts localhost, production, and this team's preview domains", async () => {
    const { getAuth } = await import("./auth");
    const auth = getAuth();

    expect(auth.options.trustedOrigins).toEqual([
      "http://localhost:3000",
      "https://my-rolls-weld.vercel.app",
      "https://*-ngantrucles-projects.vercel.app",
    ]);
  });

  it("registers oAuthProxy with the production URL, before nextCookies (which must be last)", async () => {
    const { getAuth } = await import("./auth");
    const auth = getAuth();
    const pluginIds = auth.options.plugins?.map((plugin) => plugin.id);

    expect(pluginIds).toEqual(["oauth-proxy", "next-cookies"]);

    const oAuthProxyPlugin = auth.options.plugins?.find((plugin) => plugin.id === "oauth-proxy");
    expect(oAuthProxyPlugin?.options).toEqual({
      productionURL: "https://my-rolls-weld.vercel.app",
    });
  });

  it("resolves baseURL for the current environment (production here)", async () => {
    vi.stubEnv("VERCEL_ENV", "production");

    const { getAuth } = await import("./auth");
    const auth = getAuth();

    expect(auth.options.baseURL).toBe("https://my-rolls-weld.vercel.app");
  });

  it("uses the pg-backed Drizzle adapter with transactions enabled (Better Auth needs real transactions)", async () => {
    const { drizzleAdapter } = await import("better-auth/adapters/drizzle");
    const { getDb } = await import("@/db/client");
    const { getAuth } = await import("./auth");

    getAuth();

    expect(drizzleAdapter).toHaveBeenCalledWith(
      getDb(),
      expect.objectContaining({ provider: "pg", transaction: true }),
    );
  });

  it("memoizes the instance across calls", async () => {
    const { getAuth } = await import("./auth");

    expect(getAuth()).toBe(getAuth());
  });
});
