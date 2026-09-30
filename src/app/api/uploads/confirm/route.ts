import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { confirmFramesCore, confirmRequestSchema } from "@/features/uploads/core";
import { sessionUserId } from "@/features/uploads/session";
import { headObject } from "@/lib/r2";

/** Phase 2 plan D14: HEADs each frame's three objects and marks the complete ones ready. */
export async function POST(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = confirmRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  return NextResponse.json(await confirmFramesCore(getDb(), userId, body.data.frameIds, { head: headObject }));
}
