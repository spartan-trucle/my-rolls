/** COL-2, plan D8. */
export const FRAME_FILTERS = ["all", "keeper", "oops", "blank"] as const;
export type TFrameFilter = (typeof FRAME_FILTERS)[number];

export interface IMarkable {
  isKeeper: boolean;
  isBlank: boolean;
  isOops: boolean;
}

export function parseFilter(raw: unknown, opts: { allowBlank: boolean }): TFrameFilter {
  if (typeof raw !== "string" || !(FRAME_FILTERS as readonly string[]).includes(raw)) return "all";
  if (raw === "blank" && !opts.allowBlank) return "all";
  return raw as TFrameFilter;
}

export function matchesFilter(f: IMarkable, filter: TFrameFilter): boolean {
  if (filter === "keeper") return f.isKeeper;
  if (filter === "oops") return f.isOops;
  if (filter === "blank") return f.isBlank;
  return true;
}

export function filterCounts(frames: IMarkable[]): Record<TFrameFilter, number> {
  const counts = { all: 0, keeper: 0, oops: 0, blank: 0 };
  for (const f of frames) for (const key of FRAME_FILTERS) if (matchesFilter(f, key)) counts[key] += 1;
  return counts;
}
