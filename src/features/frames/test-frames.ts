import type { IRollFrame } from "./core";

/** Test fixture: a ready, unmarked frame; override what the test is about. */
export function makeFrame(patch: Partial<IRollFrame> = {}): IRollFrame {
  const position = patch.position ?? 1;
  return {
    id: `f${position}`,
    position,
    gridUrl: `https://img/grid/${position}.webp`,
    viewUrl: `https://img/view/${position}.webp`,
    width: 3000,
    height: 2000,
    isKeeper: false,
    isBlank: false,
    isOops: false,
    noteCount: 0,
    ...patch,
  };
}
