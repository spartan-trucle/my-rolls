import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { cleanupPendingFramesCore, isCronAuthorized } from "@/features/uploads/cleanup";
import { deleteObjects } from "@/lib/r2";

/**
 * Phase 2 plan D17: nightly at 03:00 Vietnam time (vercel.json `crons`). Public in the proxy
 * because Vercel Cron carries no session; `CRON_SECRET` is the only way in. It's read here
 * rather than in `getEnv()` so local runs without it still start, and an unset secret refuses
 * every call.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await cleanupPendingFramesCore(getDb(), { now: new Date(), deleteObjects }));
}
