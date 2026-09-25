import type { FilmFrame } from "@/design-system";

/**
 * Sample scans from the design canvas ("Roll Call Landing Page"), exported as
 * WebP into `public/landing/photos/`. They stand in for a real roll: "Cuộn 14,
 * Đà Lạt".
 */
export const PHOTOS = {
  pineHillDawn: "/landing/photos/pine-hill-dawn.webp",
  mistyPines: "/landing/photos/misty-pines.webp",
  lightLeakHillside: "/landing/photos/light-leak-hillside.webp",
  lowTideBeach: "/landing/photos/low-tide-beach.webp",
  treeGoldenField: "/landing/photos/tree-golden-field.webp",
  nightStreet: "/landing/photos/night-street.webp",
  windowPortrait: "/landing/photos/window-portrait.webp",
  blurryPortrait: "/landing/photos/blurry-portrait.webp",
  paperLanterns: "/landing/photos/paper-lanterns.webp",
} as const;

export type TPhotoKey = keyof typeof PHOTOS;

export const CAMERA_SRC = "/landing/camera.webp";

type TFrameSpec = { photo?: TPhotoKey; flag?: FilmFrame["flag"] };

/** The whole sample roll, in frame order. Frame 10 is blank. */
export const ROLL_FRAMES: TFrameSpec[] = [
  { photo: "pineHillDawn" },
  { photo: "mistyPines" },
  { photo: "lightLeakHillside", flag: "oops" },
  { photo: "lowTideBeach" },
  { photo: "treeGoldenField", flag: "keeper" },
  { photo: "nightStreet" },
  { photo: "windowPortrait" },
  { photo: "blurryPortrait" },
  { photo: "paperLanterns" },
  {},
];

/** The first frames, pulled out of the canister in the hero. */
export const HERO_FRAMES: TFrameSpec[] = [
  { photo: "pineHillDawn", flag: "keeper" },
  { photo: "lowTideBeach" },
  { photo: "treeGoldenField" },
  { photo: "mistyPines" },
];

/** Thumbnails dropping into the upload panel of the story. */
export const UPLOAD_THUMBS: TPhotoKey[] = [
  "pineHillDawn",
  "lowTideBeach",
  "treeGoldenField",
  "mistyPines",
  "nightStreet",
  "paperLanterns",
];

/**
 * Turns frame specs into `FilmStrip` frames. `alt` gets the photo key (or,
 * for a blank frame, its number) and returns the translated text.
 */
export function toFilmFrames(
  specs: TFrameSpec[],
  alt: (photo: TPhotoKey | undefined, number: number) => string,
): FilmFrame[] {
  return specs.map((spec, i) => ({
    src: spec.photo ? PHOTOS[spec.photo] : undefined,
    alt: alt(spec.photo, i + 1),
    number: i + 1,
    flag: spec.flag,
  }));
}
