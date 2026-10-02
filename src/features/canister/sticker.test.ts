import { describe, expect, it } from "vitest";
import { filmSticker } from "./sticker";

describe("filmSticker (D4)", () => {
  it.each([
    ["color-negative", 200, "C-41 · 200"],
    ["slide", 100, "E-6 · 100"],
    ["bw", 400, "B&W · 400"],
    ["cine", 500, "ECN-2 · 500"],
    ["instant", 640, "INSTANT · 640"],
  ])("%s at ISO %i reads %s", (type, iso, expected) => {
    expect(filmSticker(type, iso)).toBe(expected);
  });

  it("shows only the ISO for an unknown or missing type", () => {
    expect(filmSticker("special-effect", 200)).toBe("200");
    expect(filmSticker(null, 400)).toBe("400");
  });

  it("shows only the process when ISO is unknown, and nothing when both are", () => {
    expect(filmSticker("bw", null)).toBe("B&W");
    expect(filmSticker(null, null)).toBeNull();
  });
});
