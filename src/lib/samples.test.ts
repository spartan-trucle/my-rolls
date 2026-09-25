import { describe, expect, it } from "vitest";
import { getSamplePhoto, SAMPLE_PHOTOS } from "./samples";

describe("SAMPLE_PHOTOS", () => {
  it("lists the five canvas sample photos, in board order", () => {
    expect(SAMPLE_PHOTOS.map((photo) => photo.id)).toEqual([
      "pineForestFog",
      "pineHillSunrise",
      "hillsideLightLeak",
      "treeGoldenField",
      "lanternsAtNight",
    ]);
  });

  it("points every photo at its WebP file under /samples", () => {
    for (const photo of SAMPLE_PHOTOS) {
      expect(photo.src).toMatch(/^\/samples\/[a-z-]+\.webp$/);
    }
  });

  it("flags only the two keepers and the one oops (D20)", () => {
    expect(SAMPLE_PHOTOS.filter((photo) => photo.flag === "keeper").map((photo) => photo.id)).toEqual([
      "pineHillSunrise",
      "lanternsAtNight",
    ]);
    expect(SAMPLE_PHOTOS.filter((photo) => photo.flag === "oops").map((photo) => photo.id)).toEqual([
      "hillsideLightLeak",
    ]);
  });

  it("gives the portrait lanterns photo its own aspect ratio", () => {
    const lanterns = SAMPLE_PHOTOS.find((photo) => photo.id === "lanternsAtNight");
    expect(lanterns).toMatchObject({ width: 640, height: 960 });
  });

  it("gives every other photo the landscape 960x640 aspect ratio (960 max on the long edge, fix 4)", () => {
    for (const photo of SAMPLE_PHOTOS) {
      if (photo.id === "lanternsAtNight") continue;
      expect(photo).toMatchObject({ width: 960, height: 640 });
    }
  });
});

describe("getSamplePhoto", () => {
  it("returns the matching photo by id", () => {
    expect(getSamplePhoto("pineHillSunrise").src).toBe("/samples/pine-hill-sunrise.webp");
  });

  it("throws for an unknown id, so a typo fails loudly instead of rendering a broken image", () => {
    expect(() => getSamplePhoto("not-a-real-id")).toThrow(/unknown sample photo/i);
  });
});
