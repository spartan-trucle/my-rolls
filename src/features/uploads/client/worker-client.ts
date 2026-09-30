import type { IPreparedFile } from "./queue";

/** Review #5: a copy that takes this long is treated as stuck, so it can't hold a queue slot forever. */
export const COPIES_TIMEOUT_MS = 120_000;

interface IJob {
  resolve: (r: IPreparedFile) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, IJob>();

function settle(id: number, outcome: { result?: IPreparedFile; error?: Error }) {
  const job = pending.get(id);
  if (!job) return;
  pending.delete(id);
  clearTimeout(job.timer);
  if (outcome.result) job.resolve(outcome.result);
  else job.reject(outcome.error ?? new Error("copies failed"));
}

/**
 * A crashed worker (out of memory on a phone, a module that failed to load) never answers.
 * Fail everything it held and drop it, so the next file gets a fresh worker.
 */
function failWorker(message: string) {
  worker?.terminate();
  worker = null;
  for (const id of [...pending.keys()]) settle(id, { error: new Error(message) });
}

function getWorker(): Worker {
  if (!worker) {
    const w = new Worker(new URL("./copies.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (event: MessageEvent<{ id: number; ok: boolean; result?: IPreparedFile; error?: string }>) => {
      const { id, ok, result, error } = event.data;
      settle(id, ok && result ? { result } : { error: new Error(error ?? "copies failed") });
    };
    w.onerror = (event: ErrorEvent) => failWorker(event.message || "worker error");
    w.onmessageerror = () => failWorker("worker message error");
    worker = w;
  }
  return worker;
}

/** One shared worker for the app; the queue keeps at most 2 files in it at a time (D11). */
export function makeCopiesInWorker(file: File): Promise<IPreparedFile> {
  const w = getWorker();
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => settle(id, { error: new Error("timeout") }), COPIES_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, file });
  });
}
