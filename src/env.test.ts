import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadEnv } from "./env";

const validEnv = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  BETTER_AUTH_SECRET: "a-very-secret-value",
  GOOGLE_CLIENT_ID: "a-google-client-id",
  GOOGLE_CLIENT_SECRET: "a-google-client-secret",
};

describe("loadEnv", () => {
  it("returns typed values when every key is present", () => {
    const env = loadEnv(validEnv);

    expect(env).toEqual(validEnv);
  });

  it("throws an error naming the missing key DATABASE_URL", () => {
    const withoutDatabaseUrl = {
      BETTER_AUTH_SECRET: validEnv.BETTER_AUTH_SECRET,
    };

    expect(() => loadEnv(withoutDatabaseUrl)).toThrowError(/DATABASE_URL/);
  });

  it("throws an error naming the missing key BETTER_AUTH_SECRET", () => {
    const withoutSecret = {
      DATABASE_URL: validEnv.DATABASE_URL,
    };

    expect(() => loadEnv(withoutSecret)).toThrowError(/BETTER_AUTH_SECRET/);
  });

  it("throws when a key is present but empty", () => {
    expect(() => loadEnv({ ...validEnv, DATABASE_URL: "" })).toThrowError(
      /DATABASE_URL/,
    );
  });

  it("throws an error naming the missing key GOOGLE_CLIENT_ID", () => {
    const withoutClientId = { ...validEnv, GOOGLE_CLIENT_ID: undefined };

    expect(() => loadEnv(withoutClientId)).toThrowError(/GOOGLE_CLIENT_ID/);
  });

  it("throws an error naming the missing key GOOGLE_CLIENT_SECRET", () => {
    const withoutClientSecret = { ...validEnv, GOOGLE_CLIENT_SECRET: undefined };

    expect(() => loadEnv(withoutClientSecret)).toThrowError(/GOOGLE_CLIENT_SECRET/);
  });

  it("does not require BETTER_AUTH_URL", () => {
    const env = loadEnv(validEnv);

    expect(env.BETTER_AUTH_URL).toBeUndefined();
  });

  it("keeps BETTER_AUTH_URL when set", () => {
    const env = loadEnv({ ...validEnv, BETTER_AUTH_URL: "https://example.com" });

    expect(env.BETTER_AUTH_URL).toBe("https://example.com");
  });
});

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not throw when importing with an empty environment", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");

    await expect(import("./env")).resolves.toBeDefined();
  });

  it("throws naming the missing key on first use", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");

    const { getEnv } = await import("./env");

    expect(() => getEnv()).toThrowError(/DATABASE_URL/);
  });

  it("returns the cached object on a second call", async () => {
    vi.stubEnv("DATABASE_URL", validEnv.DATABASE_URL);
    vi.stubEnv("BETTER_AUTH_SECRET", validEnv.BETTER_AUTH_SECRET);
    vi.stubEnv("GOOGLE_CLIENT_ID", validEnv.GOOGLE_CLIENT_ID);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", validEnv.GOOGLE_CLIENT_SECRET);

    const { getEnv } = await import("./env");

    const first = getEnv();
    const second = getEnv();

    expect(second).toBe(first);
  });
});
