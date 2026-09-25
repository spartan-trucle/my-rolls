import { describe, expect, it } from "vitest";
import { resolveMigrationDatabaseUrl } from "./migration-env";

describe("resolveMigrationDatabaseUrl", () => {
  it("returns DATABASE_URL_UNPOOLED when set", () => {
    const url = resolveMigrationDatabaseUrl({
      DATABASE_URL_UNPOOLED: "postgres://direct/db",
    });

    expect(url).toBe("postgres://direct/db");
  });

  it("throws an error naming DATABASE_URL_UNPOOLED when missing", () => {
    expect(() => resolveMigrationDatabaseUrl({})).toThrowError(/DATABASE_URL_UNPOOLED/);
  });

  it("throws when the key is present but empty", () => {
    expect(() =>
      resolveMigrationDatabaseUrl({ DATABASE_URL_UNPOOLED: "" }),
    ).toThrowError(/DATABASE_URL_UNPOOLED/);
  });
});
