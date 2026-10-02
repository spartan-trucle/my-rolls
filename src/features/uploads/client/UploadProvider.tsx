"use client";

import posthog from "posthog-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { confirmUploads, putObject, requestUploadSlots } from "./http";
import { createUploadQueue, type IUploadBatch, type IUploadDeps } from "./queue";
import { makeCopiesInWorker } from "./worker-client";

interface IUploadsContext {
  batches: IUploadBatch[];
  start: (rollId: string, files: File[], startPosition: number, rollLabel?: string) => string;
  retry: (fileId: string) => void;
  retryAll: (batchId: string) => void;
}

const UploadsContext = createContext<IUploadsContext | null>(null);

const browserDeps = (): IUploadDeps => ({
  makeCopies: makeCopiesInWorker,
  requestSlots: requestUploadSlots,
  put: putObject,
  confirm: confirmUploads,
  track: (event, properties) => posthog.capture(event, properties),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
});

/**
 * Phase 2 plan D16: owns the upload queue for the whole signed-in app, so moving between pages
 * doesn't stop a batch. Closing the tab does; `beforeunload` warns while anything is in flight.
 * `deps` exists for tests.
 */
export function UploadProvider({ children, deps }: { children: ReactNode; deps?: IUploadDeps }) {
  const [batches, setBatches] = useState<IUploadBatch[]>([]);
  const queue = useMemo(() => createUploadQueue(deps ?? browserDeps(), (s) => setBatches(s.batches)), [deps]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!queue.isBusy()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [queue]);

  const value = useMemo<IUploadsContext>(
    () => ({
      batches,
      start: (rollId, files, startPosition, rollLabel) => queue.start(rollId, files, startPosition, rollLabel),
      retry: (fileId) => queue.retry(fileId),
      retryAll: (batchId) => queue.retryAll(batchId),
    }),
    [batches, queue],
  );

  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>;
}

export function useUploads(): IUploadsContext {
  const ctx = useContext(UploadsContext);
  if (!ctx) throw new Error("useUploads must be used inside UploadProvider");
  return ctx;
}
