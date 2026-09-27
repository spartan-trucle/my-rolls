import { describe, expect, it } from "vitest";
import { isFutureVnDay, toVnDateString } from "./date-utils";

describe("toVnDateString", () => {
  it("formats an epoch timestamp as YYYY-MM-DD in Asia/Ho_Chi_Minh", () => {
    // 2026-09-27T17:30:00Z is 2026-09-28 00:30 in Asia/Ho_Chi_Minh (UTC+7).
    expect(toVnDateString(Date.UTC(2026, 8, 27, 17, 30))).toBe("2026-09-28");
  });
});

describe("isFutureVnDay", () => {
  it("is false for the same calendar day", () => {
    const now = Date.UTC(2026, 8, 27, 3, 0);
    const sameDayLater = Date.UTC(2026, 8, 27, 10, 0);
    expect(isFutureVnDay(sameDayLater, now)).toBe(false);
  });

  it("is true for a later calendar day", () => {
    const now = Date.UTC(2026, 8, 27, 3, 0);
    const tomorrow = Date.UTC(2026, 8, 28, 3, 0);
    expect(isFutureVnDay(tomorrow, now)).toBe(true);
  });

  it("is false for an earlier calendar day", () => {
    const now = Date.UTC(2026, 8, 27, 3, 0);
    const yesterday = Date.UTC(2026, 8, 26, 3, 0);
    expect(isFutureVnDay(yesterday, now)).toBe(false);
  });
});
