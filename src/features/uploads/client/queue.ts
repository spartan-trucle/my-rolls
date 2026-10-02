import { orderByFileName } from "../order";
import { validateFiles } from "../validate";

/**
 * Phase 2 plan C2 (SCAN-1, SCAN-2, D11, D15): the browser side of an upload, as a scheduler
 * with no DOM so it can be tested with fake dependencies. Three stages:
 *
 * 1. copies: at most 2 files at a time (D11; the worker is memory-bound on phones).
 * 2. slots: prepared files wait as `queued` and are sent 12 at a time (D15).
 * 3. network: at most 3 files uploading or confirming (D15). Each PUT is tried 4 times,
 *    waiting 1 s, 3 s and 9 s between tries.
 *
 * One failed file never stops the others (SCAN-2); `retry` asks for fresh slots because
 * presigned URLs expire after 10 minutes.
 */

export const MAX_COPYING = 2;
export const MAX_NETWORK = 3;
export const SLOT_BATCH = 12;
export const PUT_BACKOFF_MS = [1_000, 3_000, 9_000];

export type TUploadStatus = "queued" | "copies" | "uploading" | "confirming" | "done" | "failed" | "rejected";
export type TUploadError = "too_big" | "wrong_type" | "copies" | "slot" | "put" | "confirm";

export interface IUploadFile {
  id: string;
  name: string;
  bytes: number;
  status: TUploadStatus;
  /** 0..1, for the progress bar. */
  progress: number;
  error?: TUploadError;
  /** An object URL of the 480 px copy, once made, for the list's thumbnail. Never the original. */
  thumbUrl?: string;
}

export interface IUploadBatch {
  id: string;
  rollId: string;
  /** "Cuộn #16", for the tray. */
  rollLabel?: string;
  startedAt: number;
  files: IUploadFile[];
}

export interface IUploadQueueState {
  batches: IUploadBatch[];
}

export interface IPreparedFile {
  sha256: string;
  width: number;
  height: number;
  exif: Record<string, unknown>;
  copyType: "image/webp" | "image/jpeg";
  grid: Blob;
  view: Blob;
}

export interface ISlotRequestFile {
  clientId: string;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  bytes: number;
  sha256: string;
  width: number;
  height: number;
  exif: Record<string, unknown>;
  position: number;
  copyType: "image/webp" | "image/jpeg";
  gridBytes: number;
  viewBytes: number;
}

export interface ISlotResponse {
  slots: Array<{ clientId: string; frameId: string; originalUrl: string; gridUrl: string; viewUrl: string }>;
}

export interface IUploadDeps {
  makeCopies: (file: File) => Promise<IPreparedFile>;
  requestSlots: (rollId: string, files: ISlotRequestFile[]) => Promise<ISlotResponse>;
  put: (url: string, body: Blob, contentType: string, onProgress?: (fraction: number) => void) => Promise<void>;
  confirm: (frameIds: string[]) => Promise<{ ready: string[]; missing: string[] }>;
  track: (event: string, properties: Record<string, unknown>) => void;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

interface IEntry {
  batchId: string;
  rollId: string;
  file: File;
  position: number;
  view: IUploadFile;
  prepared?: IPreparedFile;
  slot?: ISlotResponse["slots"][number];
  requesting?: boolean;
  /** Review #6: fresh slots were already fetched once after a 403 (expired URL). */
  reslotted?: boolean;
  /** Review #4: the objects are up; only the confirm call failed, so a retry re-confirms. */
  uploaded?: boolean;
}

/** R2 answers an expired presigned URL with 403; retrying the same URL can't work. */
const isExpired = (err: unknown) => err instanceof Error && err.message === "PUT 403";

/** A thumbnail is a nicety: if the platform can't make an object URL, the row shows a blank tile. */
function thumbnailUrl(blob: Blob): string | undefined {
  try {
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

let nextId = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;

export function createUploadQueue(deps: IUploadDeps, onChange: (state: IUploadQueueState) => void) {
  const batches: IUploadBatch[] = [];
  const entries: IEntry[] = [];
  const finishedBatches = new Set<string>();
  let active = 0;
  let waiters: Array<() => void> = [];

  const snapshot = (): IUploadQueueState => ({
    batches: batches.map((b) => ({ ...b, files: b.files.map((f) => ({ ...f })) })),
  });

  const emit = () => onChange(snapshot());

  const update = (entry: IEntry, patch: Partial<IUploadFile>) => {
    Object.assign(entry.view, patch);
    emit();
  };

  const fail = (entry: IEntry, stage: TUploadError, err: unknown) => {
    update(entry, { status: "failed", error: stage, progress: 0 });
    deps.track("upload_file_failed", { stage, reason: err instanceof Error ? err.message : String(err) });
  };

  const run = (task: () => Promise<void>) => {
    active++;
    void task().finally(() => {
      active--;
      pump();
    });
  };

  const count = (status: TUploadStatus[]) => entries.filter((e) => status.includes(e.view.status)).length;

  function checkFinished() {
    for (const batch of batches) {
      if (finishedBatches.has(batch.id)) continue;
      const terminal = batch.files.every((f) => f.status === "done" || f.status === "failed" || f.status === "rejected");
      if (!terminal) continue;
      finishedBatches.add(batch.id);
      deps.track("upload_batch_finished", {
        ok: batch.files.filter((f) => f.status === "done").length,
        failed: batch.files.filter((f) => f.status === "failed").length,
        duration_ms: deps.now() - batch.startedAt,
      });
    }
  }

  async function putWithRetry(url: string, body: Blob, contentType: string, onProgress?: (f: number) => void) {
    for (let attempt = 0; ; attempt++) {
      try {
        await deps.put(url, body, contentType, onProgress);
        return;
      } catch (err) {
        if (isExpired(err) || attempt >= PUT_BACKOFF_MS.length) throw err;
        await deps.sleep(PUT_BACKOFF_MS[attempt]);
      }
    }
  }

  function startCopies(entry: IEntry) {
    update(entry, { status: "copies", progress: 0 });
    run(async () => {
      try {
        entry.prepared = await deps.makeCopies(entry.file);
        update(entry, { status: "queued", thumbUrl: thumbnailUrl(entry.prepared.grid) });
      } catch (err) {
        fail(entry, "copies", err);
      }
    });
  }

  function startSlots(group: IEntry[]) {
    for (const e of group) e.requesting = true;
    run(async () => {
      try {
        const response = await deps.requestSlots(
          group[0].rollId,
          group.map((e) => ({
            clientId: e.view.id,
            fileName: e.file.name,
            contentType: e.file.type as ISlotRequestFile["contentType"],
            bytes: e.file.size,
            sha256: e.prepared!.sha256,
            width: e.prepared!.width,
            height: e.prepared!.height,
            exif: e.prepared!.exif,
            position: e.position,
            copyType: e.prepared!.copyType,
            gridBytes: e.prepared!.grid.size,
            viewBytes: e.prepared!.view.size,
          })),
        );
        const byClient = new Map(response.slots.map((s) => [s.clientId, s]));
        for (const e of group) {
          e.slot = byClient.get(e.view.id);
          if (!e.slot) fail(e, "slot", new Error("no slot returned"));
        }
      } catch (err) {
        for (const e of group) fail(e, "slot", err);
      } finally {
        for (const e of group) e.requesting = false;
      }
    });
  }

  /**
   * Review #4: a network error keeps the slot (`uploaded`), so a retry asks again about the same
   * frame instead of uploading a second copy. "Missing" drops the slot: the file must go up again.
   * `onMissing` decides what a retry does when the objects really aren't there.
   */
  async function confirmEntry(entry: IEntry, onMissing: "fail" | "reupload") {
    const slot = entry.slot!;
    update(entry, { status: "confirming", progress: 0.95 });
    try {
      const { ready } = await deps.confirm([slot.frameId]);
      if (ready.includes(slot.frameId)) {
        entry.uploaded = false;
        update(entry, { status: "done", progress: 1 });
        return;
      }
      entry.slot = undefined;
      entry.uploaded = false;
      if (onMissing === "reupload") update(entry, { status: "queued", progress: 0 });
      else fail(entry, "confirm", new Error("objects missing"));
    } catch (err) {
      entry.uploaded = true;
      fail(entry, "confirm", err);
    }
  }

  function startNetwork(entry: IEntry) {
    const slot = entry.slot!;
    update(entry, { status: "uploading", progress: 0 });
    run(async () => {
      try {
        await putWithRetry(slot.originalUrl, entry.file, entry.file.type, (f) => update(entry, { progress: f * 0.9 }));
        await putWithRetry(slot.gridUrl, entry.prepared!.grid, entry.prepared!.copyType);
        await putWithRetry(slot.viewUrl, entry.prepared!.view, entry.prepared!.copyType);
      } catch (err) {
        // Review #6: an expired URL gets fresh slots once, without asking the user.
        if (isExpired(err) && !entry.reslotted) {
          entry.reslotted = true;
          entry.slot = undefined;
          update(entry, { status: "queued", progress: 0 });
          return;
        }
        fail(entry, "put", err);
        return;
      }
      await confirmEntry(entry, "fail");
    });
  }

  function pump() {
    // Stage 1: copies.
    for (const e of entries) {
      if (count(["copies"]) >= MAX_COPYING) break;
      if (e.view.status === "queued" && !e.prepared) startCopies(e);
    }

    // Stage 2: slots, 12 at a time per roll, or fewer once nothing more can join the group.
    for (const batch of batches) {
      const waiting = entries.filter(
        (e) => e.batchId === batch.id && e.view.status === "queued" && e.prepared && !e.slot && !e.requesting,
      );
      if (waiting.length === 0) continue;
      const stillPreparing = entries.some(
        (e) => e.batchId === batch.id && (e.view.status === "copies" || (e.view.status === "queued" && !e.prepared)),
      );
      if (waiting.length >= SLOT_BATCH || !stillPreparing) {
        for (let i = 0; i < waiting.length; i += SLOT_BATCH) startSlots(waiting.slice(i, i + SLOT_BATCH));
      }
    }

    // Stage 3: network.
    for (const e of entries) {
      if (count(["uploading", "confirming"]) >= MAX_NETWORK) break;
      if (e.view.status === "queued" && e.slot) startNetwork(e);
    }

    checkFinished();
    if (active === 0) {
      const done = waiters;
      waiters = [];
      for (const resolve of done) resolve();
    }
  }

  return {
    /** Starts a batch for one roll. `startPosition` is the next frame number on that roll. */
    start(rollId: string, files: File[], startPosition: number, rollLabel?: string): string {
      const batchId = newId("batch");
      const { accepted, rejected } = validateFiles(files);
      const batch: IUploadBatch = { id: batchId, rollId, rollLabel, startedAt: deps.now(), files: [] };
      batches.push(batch);

      orderByFileName(accepted).forEach((file, i) => {
        const view: IUploadFile = { id: newId("file"), name: file.name, bytes: file.size, status: "queued", progress: 0 };
        batch.files.push(view);
        entries.push({ batchId, rollId, file, position: startPosition + i, view });
      });
      for (const r of orderByFileName(rejected)) {
        batch.files.push({ id: newId("file"), name: r.name, bytes: r.bytes, status: "rejected", progress: 0, error: r.reason });
      }

      deps.track("upload_batch_started", { files: accepted.length, bytes: accepted.reduce((n, f) => n + f.size, 0) });
      emit();
      pump();
      return batchId;
    },

    /** Retries one failed file. Its copies are kept unless they were what failed; slots are always new. */
    retry(fileId: string) {
      const entry = entries.find((e) => e.view.id === fileId);
      if (!entry || entry.view.status !== "failed") return;
      const stage = entry.view.error;
      update(entry, { error: undefined });
      // Review #4: the objects went up and only the confirm call failed: ask again, don't re-upload.
      if (stage === "confirm" && entry.uploaded && entry.slot) {
        run(() => confirmEntry(entry, "reupload"));
        return;
      }
      if (stage === "copies") entry.prepared = undefined;
      entry.slot = undefined;
      entry.reslotted = false;
      update(entry, { status: "queued", progress: 0 });
      pump();
    },

    retryAll(batchId: string) {
      for (const e of entries) if (e.batchId === batchId && e.view.status === "failed") this.retry(e.view.id);
    },

    getState: snapshot,

    /** True while any file is still moving (for the beforeunload warning, D16). */
    isBusy(): boolean {
      return active > 0 || entries.some((e) => e.view.status === "queued");
    },

    /** Resolves once nothing is in flight. */
    idle(): Promise<void> {
      if (active === 0) return Promise.resolve();
      return new Promise((resolve) => waiters.push(resolve));
    },
  };
}

export type TUploadQueue = ReturnType<typeof createUploadQueue>;
