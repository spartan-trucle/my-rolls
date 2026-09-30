import { describe, expect, it } from "vitest";
import { isFutureVnDay, isFutureVnMonth, toVnDateString, vnMonthEnd, vnMonthStart } from "./date-utils";

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

describe("vnMonthStart", () => {
  it("is the 1st, 00:00:00.000 in Asia/Ho_Chi_Minh (UTC+7), as its UTC instant", () => {
    const date = vnMonthStart(10, 2026);
    // 01.10.2026 00:00 +07:00 = 30.09.2026 17:00 UTC.
    expect(date.toISOString()).toBe("2026-09-30T17:00:00.000Z");
    expect(toVnDateString(date.getTime())).toBe("2026-10-01");
  });

  it("handles January rolling back into the previous UTC year", () => {
    const date = vnMonthStart(1, 2026);
    expect(toVnDateString(date.getTime())).toBe("2026-01-01");
  });
});

describe("vnMonthEnd", () => {
  it("is the last day, 23:59:59.999 in Asia/Ho_Chi_Minh, for a 31-day month", () => {
    const date = vnMonthEnd(10, 2026);
    expect(toVnDateString(date.getTime())).toBe("2026-10-31");
  });

  it("stops at the 30th for a 30-day month", () => {
    const date = vnMonthEnd(4, 2026);
    expect(toVnDateString(date.getTime())).toBe("2026-04-30");
  });

  it("stops at the 28th for February in a non-leap year", () => {
    const date = vnMonthEnd(2, 2026);
    expect(toVnDateString(date.getTime())).toBe("2026-02-28");
  });

  it("stops at the 29th for February in a leap year", () => {
    const date = vnMonthEnd(2, 2028);
    expect(toVnDateString(date.getTime())).toBe("2028-02-29");
  });

  it("handles December rolling into the next UTC year", () => {
    const date = vnMonthEnd(12, 2026);
    expect(toVnDateString(date.getTime())).toBe("2026-12-31");
  });

  it("is strictly after vnMonthStart of the same month", () => {
    expect(vnMonthEnd(2, 2026).getTime()).toBeGreaterThan(vnMonthStart(2, 2026).getTime());
  });
});

describe("isFutureVnMonth", () => {
  const now = Date.UTC(2026, 8, 27, 3, 0); // 27.09.2026, Vietnam time.

  it("is false for the current Vietnam month", () => {
    expect(isFutureVnMonth(9, 2026, now)).toBe(false);
  });

  it("is true for a later month in the same year", () => {
    expect(isFutureVnMonth(10, 2026, now)).toBe(true);
  });

  it("is true for the same month in a later year", () => {
    expect(isFutureVnMonth(9, 2027, now)).toBe(true);
  });

  it("is false for an earlier month", () => {
    expect(isFutureVnMonth(8, 2026, now)).toBe(false);
  });

  it("is false for an earlier year", () => {
    expect(isFutureVnMonth(9, 2025, now)).toBe(false);
  });
});
