import { describe, expect, it } from "vitest";
import { formatJoinedDate } from "./format-joined-date";

describe("formatJoinedDate", () => {
  it("formats in Asia/Ho_Chi_Minh (UTC+7), not the server's local time", () => {
    expect(formatJoinedDate(new Date("2026-09-24T18:30:00Z"))).toBe("25.09.26");
  });

  it("stays on the same Vietnam day right up to the UTC+7 boundary", () => {
    expect(formatJoinedDate(new Date("2026-09-25T16:59:00Z"))).toBe("25.09.26");
  });

  it("rolls over to the next Vietnam day right at the UTC+7 boundary", () => {
    expect(formatJoinedDate(new Date("2026-09-25T17:00:00Z"))).toBe("26.09.26");
  });

  it("accepts an ISO string too (session dates round-trip through JSON)", () => {
    expect(formatJoinedDate("2026-09-24T18:30:00Z")).toBe("25.09.26");
  });
});
