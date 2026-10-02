import type { IMarkable } from "./filters";

/** COL-4 selection, plan D11–D12. Every function returns a new Set. */
export function toggleId(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Shift-click: anchor..id in the order the user sees (Review Focus 2). */
export function selectRange(shown: readonly string[], anchor: string | null, id: string, selected: ReadonlySet<string>): Set<string> {
  const from = anchor === null ? -1 : shown.indexOf(anchor);
  const to = shown.indexOf(id);
  if (from === -1 || to === -1) return toggleId(selected, id);
  const next = new Set(selected);
  for (const sid of shown.slice(Math.min(from, to), Math.max(from, to) + 1)) next.add(sid);
  return next;
}

export function pruneToShown(selected: ReadonlySet<string>, shown: readonly string[]): Set<string> {
  const visible = new Set(shown);
  return new Set([...selected].filter((id) => visible.has(id)));
}

/** True = set the mark on all; false = every selected frame has it, so remove it. */
export function nextMarkValue(frames: readonly IMarkable[], mark: "keeper" | "blank"): boolean {
  if (frames.length === 0) return true;
  return !frames.every((f) => (mark === "keeper" ? f.isKeeper : f.isBlank));
}
