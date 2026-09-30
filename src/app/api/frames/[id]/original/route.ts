import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getOriginalKeyCore } from "@/features/uploads/core";
import { sessionUserId } from "@/features/uploads/session";
import { createPresignedDownloadUrl } from "@/lib/r2";

/** Phase 2 plan D18: the original loads only at 100% zoom, through a 5-minute signed GET for its owner. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const key = await getOriginalKeyCore(getDb(), userId, id);
  if (!key) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const response = NextResponse.redirect(await createPresignedDownloadUrl({ key }), 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
