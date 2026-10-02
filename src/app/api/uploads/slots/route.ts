import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { requestSlotsCore, slotsRequestSchema } from "@/features/uploads/core";
import { sessionUserId } from "@/features/uploads/session";
import { presignPut } from "@/lib/r2";

/**
 * Phase 2 plan D9: a route handler, not a Server Action, because Next.js runs one Server Action
 * at a time per client and the upload queue keeps three files in flight.
 */
export async function POST(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = slotsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const result = await requestSlotsCore(getDb(), userId, body.data, { sign: presignPut });
  if (result.ok) return NextResponse.json({ scanSetId: result.scanSetId, slots: result.slots });

  const error = "clientId" in result ? { error: result.error, clientId: result.clientId } : { error: result.error };
  return NextResponse.json(error, { status: result.error === "not_found" ? 404 : 400 });
}
