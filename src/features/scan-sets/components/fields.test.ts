import { describe, expect, it } from "vitest";
import { RESOLUTION_CHOICES, parsePriceVnd, parsePushPullThirds, resolutionChoiceFor, thirdsToLabel, toDateInput } from "./fields";

describe("parsePushPullThirds (D8)", () => {
  it.each([
    ["+1", 3],
    ["−⅓", -1],
    ["-1/3", -1],
    ["+2/3", 2],
    ["+⅔", 2],
    ["-2", -6],
    ["0", 0],
    ["1", 3],
  ])("reads %s as %i thirds", (input, thirds) => {
    expect(parsePushPullThirds(input)).toBe(thirds);
  });

  it("is null for an empty field and undefined for something it can't read", () => {
    expect(parsePushPullThirds("  ")).toBeNull();
    expect(parsePushPullThirds("abc")).toBeUndefined();
  });
});

describe("thirdsToLabel", () => {
  it("writes thirds back in the app's push/pull style", () => {
    expect(thirdsToLabel(3)).toBe("+1");
    expect(thirdsToLabel(-1)).toBe("−⅓");
    expect(thirdsToLabel(0)).toBe("0");
    expect(thirdsToLabel(null)).toBe("");
  });
});

describe("parsePriceVnd", () => {
  it("reads Vietnamese thousands separators", () => {
    expect(parsePriceVnd("90.000")).toBe(90_000);
    expect(parsePriceVnd("90000")).toBe(90_000);
    expect(parsePriceVnd("")).toBeNull();
    expect(parsePriceVnd("chín mươi")).toBeUndefined();
  });
});

describe("scan size chips", () => {
  it("map to standard lab long edges and back to the nearest chip", () => {
    expect(RESOLUTION_CHOICES.map((c) => c.px)).toEqual([3024, 4492, 6774]);
    expect(resolutionChoiceFor(3000)).toBe("normal");
    expect(resolutionChoiceFor(6000)).toBe("xlarge");
    expect(resolutionChoiceFor(null)).toBeNull();
  });
});

describe("toDateInput", () => {
  it("formats a date as yyyy-mm-dd in Vietnam time", () => {
    expect(toDateInput(new Date("2026-11-11T20:00:00Z"))).toBe("2026-11-12");
  });
});
