import { describe, expect, it } from "vitest";
import { stripGps } from "./strip-gps";

describe("stripGps", () => {
  it("drops every GPS tag and keeps the rest", () => {
    const exif = { Make: "NORITSU", latitude: 10.77, longitude: 106.7, GPSLatitude: [10, 46, 12], GPSAltitude: 5 };
    expect(stripGps(exif)).toEqual({ Make: "NORITSU" });
  });
});
