import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Better Auth's core tables (D4): `user`, `session`, `account`,
 * `verification`. No roll/bag/frame tables yet — Known conflicts #4 and #6
 * block those until before Phase 1.
 *
 * Column names are Better Auth's CLI default (snake_case); the object keys
 * below are its default field names (camelCase), matching what the Drizzle
 * adapter and the rest of Better Auth's code read and write by
 * (`@better-auth/core`'s `getAuthTables()`). `user.email` is required (D5).
 * The Google subject id lives in `account.accountId`, not on `user` (D6).
 *
 * Every timestamp is `timestamp with time zone` (migration 0001): plain
 * `timestamp` drops the offset, which is wrong for anything Better Auth
 * compares against "now" (session/verification expiry, OAuth token expiry).
 * The JS-side mode stays `Date` — `withTimezone` only changes the SQL type,
 * not `mode` (Drizzle defaults to `mode: "date"`, which is what Better
 * Auth's adapter expects).
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  // Every session lookup by user (e.g. sign-out, session listing) filters
  // on user_id (migration 0001; matches Better Auth's own default schema,
  // which marks session.userId `index: true`).
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Better Auth's internal adapter looks up an account by this pair on
    // every OAuth sign-in (`findAccountByKey`/`findAccountOwnerByKey`), but
    // defends against more than one match rather than assuming it (it
    // throws if a `limit: 2` query returns two rows) — Better Auth does not
    // itself guarantee one account per provider id per provider (it's not
    // one of its own default schema indexes either), so this stays a plain
    // index, not a unique constraint (migration 0001).
    index("account_provider_id_account_id_idx").on(table.providerId, table.accountId),
    // Matches Better Auth's own default schema (account.userId `index:
    // true`): account linking/unlinking looks up all of a user's accounts.
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Every verification (email OTP, etc.) is looked up by identifier
  // (migration 0001; matches Better Auth's own default schema, which marks
  // verification.identifier `index: true`).
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
