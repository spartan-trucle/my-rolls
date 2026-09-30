import { describe, expect, it, vi } from "vitest";
import { createUploadQueue, type IPreparedFile, type ISlotRequestFile, type IUploadDeps, type IUploadQueueState } from "./queue";

const jpg = (name: string, bytes = 100) => new File([new Uint8Array(bytes)], name, { type: "image/jpeg" });

const prepared = (): IPreparedFile => ({
  sha256: "a".repeat(64),
  width: 3000,
  height: 2000,
  exif: {},
  copyType: "image/webp",
  grid: new Blob(["g"]),
  view: new Blob(["v"]),
});

/** Deps that succeed instantly; each test overrides what it needs. `sleep` records backoff and never waits. */
function deps(overrides: Partial<IUploadDeps> = {}) {
  let frame = 0;
  const base: IUploadDeps = {
    makeCopies: vi.fn(async () => prepared()),
    requestSlots: vi.fn(async (_rollId: string, files: ISlotRequestFile[]) => ({
      slots: files.map((f) => ({
        clientId: f.clientId,
        frameId: `frame-${++frame}`,
        originalUrl: `put://o/${f.clientId}`,
        gridUrl: `put://g/${f.clientId}`,
        viewUrl: `put://v/${f.clientId}`,
      })),
    })),
    put: vi.fn(async () => {}),
    confirm: vi.fn(async (ids: string[]) => ({ ready: ids, missing: [] })),
    track: vi.fn(),
    sleep: vi.fn(async () => {}),
    now: () => 1_000,
  };
  return { ...base, ...overrides };
}

async function run(queueDeps: IUploadDeps, files: File[], startPosition = 1) {
  const states: IUploadQueueState[] = [];
  const queue = createUploadQueue(queueDeps, (s) => states.push(s));
  const batchId = queue.start("roll-1", files, startPosition);
  await queue.idle();
  return { queue, batchId, states, last: queue.getState() };
}

const statuses = (state: IUploadQueueState) => state.batches.flatMap((b) => b.files.map((f) => f.status));

describe("upload queue", () => {
  it("uploads every file and ends done, ordered by file name with positions from startPosition", async () => {
    const d = deps();
    const { last } = await run(d, [jpg("10.jpg"), jpg("2.jpg"), jpg("1.jpg")], 5);
    expect(last.batches[0].files.map((f) => [f.name, f.status])).toEqual([
      ["1.jpg", "done"],
      ["2.jpg", "done"],
      ["10.jpg", "done"],
    ]);
    const sent = (d.requestSlots as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[1]);
    expect(sent.map((f: { fileName: string; position: number }) => [f.fileName, f.position])).toEqual([
      ["1.jpg", 5],
      ["2.jpg", 6],
      ["10.jpg", 7],
    ]);
  });

  it("puts the original and both copies with their content types", async () => {
    const d = deps();
    await run(d, [jpg("1.jpg")]);
    const puts = (d.put as ReturnType<typeof vi.fn>).mock.calls.map((c) => [String(c[0]).slice(0, 8), c[2]]);
    expect(puts.sort()).toEqual([
      ["put://g/", "image/webp"],
      ["put://o/", "image/jpeg"],
      ["put://v/", "image/webp"],
    ]);
  });

  it("never sends rejected files to the server", async () => {
    const d = deps();
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    const tiff = new File([new Uint8Array(10)], "a.tif", { type: "image/tiff" });
    const { last } = await run(d, [jpg("1.jpg"), big, tiff]);
    expect(last.batches[0].files.map((f) => [f.name, f.status, f.error])).toEqual([
      ["1.jpg", "done", undefined],
      ["a.tif", "rejected", "wrong_type"],
      ["big.jpg", "rejected", "too_big"],
    ]);
    const sent = (d.requestSlots as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[1]);
    expect(sent.map((f: { fileName: string }) => f.fileName)).toEqual(["1.jpg"]);
  });

  it("asks for slots 12 files at a time: 36 files, 3 calls", async () => {
    const d = deps();
    await run(d, Array.from({ length: 36 }, (_, i) => jpg(`${i + 1}.jpg`)));
    const calls = (d.requestSlots as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c[1].length === 12)).toBe(true);
  });

  it("keeps at most 2 files making copies and at most 3 uploading or confirming", async () => {
    let copying = 0;
    let network = 0;
    let maxCopying = 0;
    let maxNetwork = 0;
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const d = deps({
      makeCopies: vi.fn(async () => {
        maxCopying = Math.max(maxCopying, ++copying);
        await tick();
        copying--;
        return prepared();
      }),
      put: vi.fn(async () => {
        await tick();
      }),
    });
    const states: IUploadQueueState[] = [];
    const queue = createUploadQueue(d, (s) => {
      states.push(s);
      const all = statuses(s);
      network = all.filter((x) => x === "uploading" || x === "confirming").length;
      maxNetwork = Math.max(maxNetwork, network);
    });
    queue.start("roll-1", Array.from({ length: 20 }, (_, i) => jpg(`${i + 1}.jpg`)), 1);
    await queue.idle();
    expect(maxCopying).toBeLessThanOrEqual(2);
    expect(maxNetwork).toBeLessThanOrEqual(3);
    expect(statuses(queue.getState()).every((s) => s === "done")).toBe(true);
  });

  it("retries a failing PUT with 1 s, 3 s, 9 s backoff, and succeeds on the third try", async () => {
    let calls = 0;
    const d = deps({
      put: vi.fn(async (url: string) => {
        if (url.startsWith("put://o/") && ++calls <= 2) throw new Error("network");
      }),
    });
    const { last } = await run(d, [jpg("1.jpg")]);
    expect(last.batches[0].files[0].status).toBe("done");
    expect((d.sleep as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0])).toEqual([1_000, 3_000]);
  });

  it("fails one file after 4 PUT attempts without stopping the others", async () => {
    const d = deps({
      put: vi.fn(async (url: string, blob: Blob) => {
        if (url.startsWith("put://o/") && (blob as File).name === "2.jpg") throw new Error("network");
      }),
    });
    const { last } = await run(d, [jpg("1.jpg"), jpg("2.jpg"), jpg("3.jpg")]);
    expect(last.batches[0].files.map((f) => [f.name, f.status, f.error])).toEqual([
      ["1.jpg", "done", undefined],
      ["2.jpg", "failed", "put"],
      ["3.jpg", "done", undefined],
    ]);
    expect(d.track).toHaveBeenCalledWith("upload_file_failed", { stage: "put", reason: "network" });
  });

  it("retry(id) asks for fresh slots and finishes the file", async () => {
    let failOnce = true;
    const d = deps({
      put: vi.fn(async (url: string) => {
        if (failOnce && url.startsWith("put://o/")) throw new Error("network");
      }),
    });
    const { queue, last } = await run(d, [jpg("1.jpg")]);
    const file = last.batches[0].files[0];
    expect(file.status).toBe("failed");

    failOnce = false;
    const slotCallsBefore = (d.requestSlots as ReturnType<typeof vi.fn>).mock.calls.length;
    queue.retry(file.id);
    await queue.idle();
    expect(queue.getState().batches[0].files[0].status).toBe("done");
    expect((d.requestSlots as ReturnType<typeof vi.fn>).mock.calls.length).toBe(slotCallsBefore + 1);
  });

  it("fails with 'confirm' when the server can't find the objects", async () => {
    const d = deps({ confirm: vi.fn(async (ids: string[]) => ({ ready: [], missing: ids })) });
    const { last } = await run(d, [jpg("1.jpg")]);
    expect(last.batches[0].files[0]).toMatchObject({ status: "failed", error: "confirm" });
  });

  it("fails every file of a slot call with 'slot' when the call throws", async () => {
    const d = deps({ requestSlots: vi.fn(async () => Promise.reject(new Error("500"))) });
    const { last } = await run(d, [jpg("1.jpg"), jpg("2.jpg")]);
    expect(last.batches[0].files.map((f) => f.error)).toEqual(["slot", "slot"]);
  });

  it("fails with 'copies' when the copies can't be made", async () => {
    const d = deps({ makeCopies: vi.fn(async () => Promise.reject(new Error("decode"))) });
    const { last } = await run(d, [jpg("1.jpg")]);
    expect(last.batches[0].files[0]).toMatchObject({ status: "failed", error: "copies" });
  });

  it("tracks the batch start once and the batch finish once", async () => {
    const d = deps();
    await run(d, [jpg("1.jpg", 10), jpg("2.jpg", 20)]);
    const events = (d.track as ReturnType<typeof vi.fn>).mock.calls;
    expect(events.filter((e) => e[0] === "upload_batch_started")).toEqual([["upload_batch_started", { files: 2, bytes: 30 }]]);
    expect(events.filter((e) => e[0] === "upload_batch_finished")).toEqual([
      ["upload_batch_finished", { ok: 2, failed: 0, duration_ms: 0 }],
    ]);
  });

  it("reports whether anything is still in flight", async () => {
    const d = deps();
    const queue = createUploadQueue(d, () => {});
    expect(queue.isBusy()).toBe(false);
    queue.start("roll-1", [jpg("1.jpg")], 1);
    expect(queue.isBusy()).toBe(true);
    await queue.idle();
    expect(queue.isBusy()).toBe(false);
  });
});
