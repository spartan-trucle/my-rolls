"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IRollFrame } from "@/features/frames/core";
import { pruneToShown, selectRange, toggleId } from "./selection";

/** COL-4 selection over the frames currently shown (D11). Frames the filter stops showing leave it (Review Focus 1). */
export function useFrameSelection(shown: IRollFrame[]) {
  const ids = useMemo(() => shown.map((f) => f.id), [shown]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [anchor, setAnchor] = useState<string | null>(null);

  // Pruned while rendering when `shown` changes (React's "adjusting state on a prop change"), not in an effect.
  const [prevIds, setPrevIds] = useState(ids);
  if (prevIds !== ids) {
    setPrevIds(ids);
    const next = pruneToShown(selected, ids);
    if (next.size !== selected.size) setSelected(next);
    if (anchor !== null && !ids.includes(anchor)) setAnchor(null);
  }

  const click = useCallback(
    (id: string, opts: { shift: boolean }) => {
      setSelected((s) => (opts.shift ? selectRange(ids, anchor, id, s) : toggleId(s, id)));
      setAnchor(id);
    },
    [ids, anchor],
  );
  const toggle = useCallback((id: string) => click(id, { shift: false }), [click]);
  const selectAll = useCallback(() => setSelected(new Set(ids)), [ids]);
  const clear = useCallback(() => {
    setSelected(new Set());
    setAnchor(null);
  }, []);
  const selectedFrames = useMemo(() => shown.filter((f) => selected.has(f.id)), [shown, selected]);

  return { selected, anchor, click, toggle, selectAll, clear, selectedFrames };
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  // jsdom has no isContentEditable; the attribute check covers it.
  return target.isContentEditable || target.closest('[contenteditable]:not([contenteditable="false"])') !== null;
}

export interface IMarkShortcutHandlers {
  keeper(): void;
  oops(): void;
  blank(): void;
  clear(): void;
  selectAll(): void;
}

/** COL-4 desktop shortcuts K / O / B, Esc, Ctrl/⌘+A (Review Focus 3). Off while typing, and while `enabled` is false. */
export function useMarkShortcuts(enabled: boolean, handlers: IMarkShortcutHandlers) {
  // The latest handlers, without re-adding the listener every render.
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTyping(e.target) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === "a" && !e.shiftKey) {
          e.preventDefault();
          ref.current.selectAll();
        }
        return;
      }
      if (key === "k") ref.current.keeper();
      else if (key === "o") ref.current.oops();
      else if (key === "b") ref.current.blank();
      else if (key === "escape") ref.current.clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
