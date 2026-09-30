import type { IPreparedFile } from "./queue";

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (r: IPreparedFile) => void; reject: (e: Error) => void }>();

/** One shared worker for the app; the queue keeps at most 2 files in it at a time (D11). */
export function makeCopiesInWorker(file: File): Promise<IPreparedFile> {
  if (!worker) {
    worker = new Worker(new URL("./copies.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; result?: IPreparedFile; error?: string }>) => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      if (event.data.ok && event.data.result) job.resolve(event.data.result);
      else job.reject(new Error(event.data.error ?? "copies failed"));
    };
  }
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, file });
  });
}
