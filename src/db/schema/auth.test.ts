import { getTableColumns, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, session, user, verification } from "./auth";

/**
 * D4: Better Auth's core tables only. Column names are its CLI default
 * (snake_case); the object keys (`emailVerified`, `accountId`, …) are its
 * default field names, since that's what the Drizzle adapter and the rest
 * of Better Auth's code read/write by. D6: the Google subject id lives in
 * `account.accountId`, never on `user`.
 */
describe("auth schema", () => {
  it("names the four tables in English, singular (D4, D15)", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
  });

  it("maps user's camelCase fields to snake_case columns and keeps email required (D5)", () => {
    const columns = getTableColumns(user);

    expect(columns.id.primary).toBe(true);
    expect(columns.name.name).toBe("name");
    expect(columns.name.notNull).toBe(true);
    expect(columns.email.name).toBe("email");
    expect(columns.email.notNull).toBe(true);
    expect(columns.email.isUnique).toBe(true);
    expect(columns.emailVerified.name).toBe("email_verified");
    expect(columns.emailVerified.notNull).toBe(true);
    expect(columns.image.name).toBe("image");
    expect(columns.image.notNull).toBe(false);
    expect(columns.createdAt.name).toBe("created_at");
    expect(columns.updatedAt.name).toBe("updated_at");
  });

  it("does not carry a google_sub-style column on user (D6)", () => {
    const columns = getTableColumns(user);

    expect(Object.keys(columns).sort()).toEqual(
      ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"].sort(),
    );
  });

  it("keys session to user with cascade delete", () => {
    const columns = getTableColumns(session);

    expect(columns.expiresAt.name).toBe("expires_at");
    expect(columns.token.name).toBe("token");
    expect(columns.token.isUnique).toBe(true);
    expect(columns.ipAddress.name).toBe("ip_address");
    expect(columns.userAgent.name).toBe("user_agent");
    expect(columns.userId.name).toBe("user_id");
    expect(columns.userId.notNull).toBe(true);
  });

  it("stores the Google subject id in account.accountId (D6)", () => {
    const columns = getTableColumns(account);

    expect(columns.accountId.name).toBe("account_id");
    expect(columns.accountId.notNull).toBe(true);
    expect(columns.providerId.name).toBe("provider_id");
    expect(columns.userId.name).toBe("user_id");
    expect(columns.accessToken.name).toBe("access_token");
    expect(columns.refreshToken.name).toBe("refresh_token");
    expect(columns.idToken.name).toBe("id_token");
    expect(columns.accessTokenExpiresAt.name).toBe("access_token_expires_at");
    expect(columns.refreshTokenExpiresAt.name).toBe("refresh_token_expires_at");
  });

  it("maps verification's fields to snake_case columns", () => {
    const columns = getTableColumns(verification);

    expect(columns.identifier.name).toBe("identifier");
    expect(columns.identifier.notNull).toBe(true);
    expect(columns.value.name).toBe("value");
    expect(columns.expiresAt.name).toBe("expires_at");
  });
});
