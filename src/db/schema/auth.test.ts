import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { account, session, user, verification } from "./auth";

/**
 * `Index.config.columns` is typed `Partial<IndexedColumn | SQL>[]` — every
 * index this schema defines indexes plain columns, never a SQL expression,
 * so this narrows that union for the assertions below instead of casting.
 */
function indexColumnNames(columns: readonly unknown[]): string[] {
  return columns.map((column) => {
    if (
      !column ||
      typeof column !== "object" ||
      !("name" in column) ||
      typeof column.name !== "string"
    ) {
      throw new Error("Expected every index column here to be a plain table column");
    }
    return column.name;
  });
}

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

  /**
   * Migration 0001: every timestamp across the four tables carries an
   * offset (`timestamptz`), not just `created_at`/`updated_at` — Postgres's
   * plain `timestamp` silently drops the zone, which is wrong for anything
   * Better Auth compares against "now" (session/verification expiry, OAuth
   * token expiry). The JS-side mode stays `Date` (Better Auth's adapter
   * expects `Date`, not a string) — `withTimezone` only changes the SQL
   * type, not `mode`.
   */
  it("stores every timestamp column with a time zone (migration 0001)", () => {
    const tablesWithTimestamps = [user, session, account, verification];
    const timestampColumns = tablesWithTimestamps.flatMap((table) =>
      Object.values(getTableColumns(table)).filter(
        (column) => column.columnType === "PgTimestamp",
      ),
    );

    // Sanity check the filter actually found the columns this test cares
    // about, so a schema change silently emptying the list can't pass.
    expect(timestampColumns.length).toBe(12);

    for (const column of timestampColumns) {
      expect(column.getSQLType()).toBe("timestamp with time zone");
    }
  });

  /**
   * Migration 0001: indexes for Better Auth's hottest lookups. `userId` on
   * `session`/`account` and `identifier` on `verification` match Better
   * Auth's own default schema (`index: true` in `@better-auth/core`'s
   * `getAuthTables()`). `(provider_id, account_id)` isn't one of Better
   * Auth's own defaults — its internal adapter queries by that pair on
   * every OAuth sign-in (`findAccountByKey`/`findAccountOwnerByKey`) but
   * defends against, rather than assumes, at most one match (it throws if
   * `findMany(..., limit: 2)` returns more than one row) — so Better Auth
   * does not guarantee one account per provider id per provider, and this
   * index is a plain (non-unique) index, not a unique constraint.
   */
  it("indexes account(provider_id, account_id), account.user_id, session.user_id, and verification.identifier", () => {
    const accountIndexes = getTableConfig(account).indexes;
    const sessionIndexes = getTableConfig(session).indexes;
    const verificationIndexes = getTableConfig(verification).indexes;

    const providerAccountIndex = accountIndexes.find(
      (index) => index.config.name === "account_provider_id_account_id_idx",
    );
    expect(providerAccountIndex).toBeDefined();
    expect(providerAccountIndex?.config.unique).toBe(false);
    expect(indexColumnNames(providerAccountIndex?.config.columns ?? [])).toEqual([
      "provider_id",
      "account_id",
    ]);

    const accountUserIdIndex = accountIndexes.find(
      (index) => index.config.name === "account_user_id_idx",
    );
    expect(accountUserIdIndex).toBeDefined();
    expect(indexColumnNames(accountUserIdIndex?.config.columns ?? [])).toEqual(["user_id"]);

    const sessionUserIdIndex = sessionIndexes.find(
      (index) => index.config.name === "session_user_id_idx",
    );
    expect(sessionUserIdIndex).toBeDefined();
    expect(indexColumnNames(sessionUserIdIndex?.config.columns ?? [])).toEqual(["user_id"]);

    const verificationIdentifierIndex = verificationIndexes.find(
      (index) => index.config.name === "verification_identifier_idx",
    );
    expect(verificationIdentifierIndex).toBeDefined();
    expect(indexColumnNames(verificationIdentifierIndex?.config.columns ?? [])).toEqual([
      "identifier",
    ]);
  });
});
