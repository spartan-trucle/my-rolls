import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

import { getEnv } from "@/env";

/**
 * The minimal shape `pingDatabase` needs from a SQL client: callable as a
 * tagged template. `NeonQueryFunction` satisfies this structurally, and a
 * plain `vi.fn()` in tests satisfies it too, without pulling in the rest of
 * `NeonQueryFunction`'s surface (`query`, `unsafe`, `transaction`).
 */
export type TSqlPing = (
  strings: TemplateStringsArray,
  ...params: unknown[]
) => Promise<unknown>;

/**
 * Runs `select 1` against the given SQL client. Takes the client as a
 * parameter (rather than creating one internally) so tests can inject a
 * fake and never touch the real database.
 */
export async function pingDatabase(sql: TSqlPing): Promise<boolean> {
  await sql`select 1`;
  return true;
}

export async function GET() {
  try {
    await pingDatabase(neon(getEnv().DATABASE_URL));
    return NextResponse.json({ ok: true, db: "up" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
