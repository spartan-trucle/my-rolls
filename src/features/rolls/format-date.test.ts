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
});
