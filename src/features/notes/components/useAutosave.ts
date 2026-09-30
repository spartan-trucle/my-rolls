"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TAutosaveState = "idle" | "saving" | "saved" | "error";
type TSave = (value: string) => Promise<{ ok: boolean; updatedAt?: Date }>;

/**
 * Phase 2 plan D20: saves `delay` ms after the last change, or at once on blur (`flush`), never
 * both for the same value. A failed save keeps the value; `retry` sends it again.
 */
export function useAutosave(
  save: TSave,
  { delay = 800, skip }: { delay?: number; /** Values never sent, e.g. an emptied note (review #14). */ skip?: (value: string) => boolean } = {},
) {
  const [state, setState] = useState<TAutosaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef<string | null>(null);
  const saveRef = useRef(save);
  const skipRef = useRef(skip);
  useEffect(() => {
    saveRef.current = save;
    skipRef.current = skip;
  }, [save, skip]);

  const run = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = pending.current;
    if (value === null) return;
    pending.current = null;
    if (skipRef.current?.(value)) return;
    last.current = value;
    setState("saving");
    const result = await saveRef.current(value).catch(() => ({ ok: false }) as { ok: boolean; updatedAt?: Date });
    if (result.ok) {
      setState("saved");
      setSavedAt(result.updatedAt ?? new Date());
    } else {
      setState("error");
    }
  }, []);

  const change = useCallback(
    (value: string) => {
      pending.current = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void run(), delay);
    },
    [delay, run],
  );

  const retry = useCallback(async () => {
    if (last.current === null) return;
    pending.current = last.current;
    await run();
  }, [run]);

  // Review #14: leaving the page (a back gesture) mid-debounce still saves what was typed.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      const value = pending.current;
      pending.current = null;
      if (value !== null && !skipRef.current?.(value)) void saveRef.current(value).catch(() => {});
    },
    [],
  );

  return { state, savedAt, change, flush: run, retry };
}
