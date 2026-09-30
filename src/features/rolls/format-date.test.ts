import { describe, expect, it } from "vitest";
import { formatRollDate } from "./format-date";

describe("formatRollDate", () => {
  it("formats as dd.mm.yy (D15's RollCard date, Home board)", () => {
    // UTC midday so the Asia/Ho_Chi_Minh (+7) conversion never crosses a
    // calendar day boundary in either direction.
    expect(formatRollDate(new Date("2025-10-12T12:00:00Z"))).toBe("12.10.25");
  });

  it("pads single-digit day and month", () => {
    expect(formatRollDate(new Date("2025-02-01T12:00:00Z"))).toBe("01.02.25");
  });

  it("returns null for a null date", () => {
    expect(formatRollDate(null)).toBeNull();
  });

  it("formats as mm.yyyy when precision is month (R2-4, audit P4)", () => {
    expect(formatRollDate(new Date("2025-10-12T12:00:00Z"), "month")).toBe("10.2025");
  });

  it("still formats dd.mm.yy when precision is day", () => {
    expect(formatRollDate(new Date("2025-10-12T12:00:00Z"), "day")).toBe("12.10.25");
  });

  it("still formats dd.mm.yy when precision is null (unknown/omitted)", () => {
    expect(formatRollDate(new Date("2025-10-12T12:00:00Z"), null)).toBe("12.10.25");
  });

  it("returns null for a null date regardless of precision", () => {
    expect(formatRollDate(null, "month")).toBeNull();
  });
});
