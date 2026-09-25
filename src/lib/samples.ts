export type TSampleFlag = "keeper" | "oops";

export interface ISamplePhoto {
  /** Stable key, also used to look the photo up and to find its alt text (`messages.samples.<id>`). */
  id: string;
  src: string;
  width: number;
  height: number;
  flag?: TSampleFlag;
}

/**
 * The five scans from the design canvas (D20), exported to WebP by Stage F.
 * Order matches the boards' own `frames` array (Login/Signup canvas
 * scripts), so anything that renders all five in a row — the sign-in
 * FilmStrip — doesn't need to re-sort them.
 */
export const SAMPLE_PHOTOS: readonly ISamplePhoto[] = [
  { id: "pineForestFog", src: "/samples/pine-forest-fog.webp", width: 1200, height: 800 },
  { id: "pineHillSunrise", src: "/samples/pine-hill-sunrise.webp", width: 1200, height: 800, flag: "keeper" },
  { id: "hillsideLightLeak", src: "/samples/hillside-light-leak.webp", width: 1200, height: 800, flag: "oops" },
  { id: "treeGoldenField", src: "/samples/tree-golden-field.webp", width: 1200, height: 800 },
  { id: "lanternsAtNight", src: "/samples/lanterns-at-night.webp", width: 800, height: 1200, flag: "keeper" },
];

/** Throws on a typo'd id instead of silently rendering a photo with no src. */
export function getSamplePhoto(id: string): ISamplePhoto {
  const photo = SAMPLE_PHOTOS.find((candidate) => candidate.id === id);
  if (!photo) throw new Error(`Unknown sample photo: ${id}`);
  return photo;
}
