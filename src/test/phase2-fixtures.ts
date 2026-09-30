import { randomUUID } from "node:crypto";
import { frame, roll, scanSet } from "@/db/schema";
import type { TTestDb } from "@/db/test-db";

/** A roll owned by `userId` with `n` ready frames at positions 1..n (Phase 2 data tests). */
export async function seedRollWithFrames(
  db: TTestDb,
  userId: string,
  n: number,
  rollValues: Partial<typeof roll.$inferInsert> = {},
) {
  const [r] = await db
    .insert(roll)
    .values({ userId, stockId: randomUUID(), cameraBagItemId: randomUUID(), ...rollValues })
    .returning();
  const [set] = await db.insert(scanSet).values({ userId, rollId: r.id }).returning();
  const frames =
    n === 0
      ? []
      : await db
          .insert(frame)
          .values(
            Array.from({ length: n }, (_, i) => {
              const id = randomUUID();
              return {
                id,
                userId,
                rollId: r.id,
                scanSetId: set.id,
                position: i + 1,
                fileName: `${i + 1}.jpg`,
                contentType: "image/jpeg",
                bytes: 10,
                width: 3000,
                height: 2000,
                originalKey: `originals/${userId}/${id}.jpg`,
                gridKey: `grid/g${i + 1}.webp`,
                viewKey: `view/v${i + 1}.webp`,
                status: "ready" as const,
              };
            }),
          )
          .returning();
  return { roll: r, scanSet: set, frames: frames.sort((a, b) => a.position - b.position) };
}
