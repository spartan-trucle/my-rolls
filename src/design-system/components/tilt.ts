export type Tilt = "none" | "left" | "right" | "wild";

export const TILT: Record<Tilt, string> = {
  none: "var(--tilt-none)",
  left: "var(--tilt-left)",
  right: "var(--tilt-right)",
  wild: "var(--tilt-wild)",
};
