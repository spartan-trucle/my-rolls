import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A stand-in for the copies worker: records posts, lets tests fire message/error events. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  onmessageerror: ((e: MessageEvent) => void) | null = null;
  posted: Array<{ id: number }> = [];
  terminated = false;
  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(data: { id: number }) {
    this.posted.push(data);
  }
  terminate() {
    this.terminated = true;
  }
}

const file = () => new File(["x"], "1.jpg", { type: "image/jpeg" });

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal("Worker", FakeWorker);
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("makeCopiesInWorker (review #5)", () => {
  it("rejects every pending job when the worker errors, and starts a fresh worker next time", async () => {
    const { makeCopiesInWorker } = await import("./worker-client");
    const a = makeCopiesInWorker(file());
    const b = makeCopiesInWorker(file());
    const w = FakeWorker.instances[0];
    w.onerror?.(new ErrorEvent("error", { message: "out of memory" }));
    await expect(a).rejects.toThrow("out of memory");
    await expect(b).rejects.toThrow("out of memory");
    expect(w.terminated).toBe(true);

    void makeCopiesInWorker(file()).catch(() => {});
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it("rejects a job that takes longer than the copies timeout", async () => {
    vi.useFakeTimers();
    const { makeCopiesInWorker, COPIES_TIMEOUT_MS } = await import("./worker-client");
    const job = makeCopiesInWorker(file());
    const assertion = expect(job).rejects.toThrow("timeout");
    await vi.advanceTimersByTimeAsync(COPIES_TIMEOUT_MS);
    await assertion;
  });

  it("still resolves a job that answers in time", async () => {
    const { makeCopiesInWorker } = await import("./worker-client");
    const job = makeCopiesInWorker(file());
    const w = FakeWorker.instances[0];
    const result = { sha256: "a", width: 1, height: 1, exif: {}, copyType: "image/webp", grid: new Blob(), view: new Blob() };
    w.onmessage?.(new MessageEvent("message", { data: { id: w.posted[0].id, ok: true, result } }));
    await expect(job).resolves.toBe(result);
  });
});
