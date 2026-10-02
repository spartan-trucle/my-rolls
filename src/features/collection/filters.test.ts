import { describe, expect, it } from "vitest";
import { filterCounts, matchesFilter, parseFilter } from "./filters";

const f = (isKeeper = false, isOops = false, isBlank = false) => ({ isKeeper, isOops, isBlank });

describe("parseFilter (D8)", () => {
  it("keeps known values and falls back to all", () => {
    expect(parseFilter("keeper", { allowBlank: true })).toBe("keeper");
    expect(parseFilter("nope", { allowBlank: true })).toBe("all");
    expect(parseFilter(["oops"], { allowBlank: true })).toBe("all");
  });

  it("refuses blank where it isn't offered (library)", () => {
    expect(parseFilter("blank", { allowBlank: false })).toBe("all");
  });
});

describe("matchesFilter / filterCounts", () => {
  const frames = [f(true), f(true, true), f(false, true), f(false, false, true), f()];

  it("a frame can be tấm ưng and oops at once (Phase 2 D5)", () => {
    expect(matchesFilter(frames[1], "keeper")).toBe(true);
    expect(matchesFilter(frames[1], "oops")).toBe(true);
  });

  it("counts every filter over the full list", () => {
    expect(filterCounts(frames)).toEqual({ all: 5, keeper: 2, oops: 2, blank: 1 });
  });
});
