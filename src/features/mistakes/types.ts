/** NOTE-2's 13 mistake types, in the requirement's order. Vietnamese labels: `mistakes.types.<slug>`. No DB imports, so client components can use it. */
export const MISTAKE_TYPES = [
  "light_leak",
  "blank_frame",
  "double_exposure",
  "missed_focus",
  "underexposed",
  "overexposed",
  "wrong_iso",
  "camera_shake",
  "opened_back",
  "rewound_early",
  "lab_dust_scratches",
  "lab_colour_cast",
  "other",
] as const;
export type TMistakeType = (typeof MISTAKE_TYPES)[number];
