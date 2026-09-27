import { describe, expect, it } from "vitest";
import { formatJoinedDate } from "./format-joined-date";

describe("formatJoinedDate", () => {
  it("formats as dd.mm.yy, zero-padded", () => {
    expect(formatJoinedDate(new Date(2026, 8, 25))).toBe("25.09.26");
  });

  it("zero-pads single-digit day and month", () => {
    expect(formatJoinedDate(new Date(2025, 0, 5))).toBe("05.01.25");
  });

  it("accepts an ISO string too (session dates round-trip through JSON)", () => {
    expect(formatJoinedDate("2026-09-25T00:00:00.000Z")).toMatch(/^\d{2}\.\d{2}\.26$/);
  });
});
