import { describe, expect, it } from "vitest";
import { formatPushPull, pushPullStops } from "./push-pull";

describe("pushPullStops", () => {
  it("returns 0 when box and shot ISO are the same", () => {
    expect(pushPullStops(100, 100)).toBe(0);
  });

  it("computes a full stop push (400 -> 800 = +1)", () => {
    expect(pushPullStops(400, 800)).toBe(1);
  });

  it("computes a third-stop pull (400 -> 320 = -1/3)", () => {
    expect(pushPullStops(400, 320)).toBeCloseTo(-1 / 3, 5);
  });

  it("computes a full stop push (200 -> 400 = +1)", () => {
    expect(pushPullStops(200, 400)).toBe(1);
  });

  it("computes two full stops push (400 -> 1600 = +2)", () => {
    expect(pushPullStops(400, 1600)).toBe(2);
  });

  it("computes a third-stop push (400 -> 500 = +1/3)", () => {
    expect(pushPullStops(400, 500)).toBeCloseTo(1 / 3, 5);
  });

  it("returns null when boxIso is missing", () => {
    expect(pushPullStops(null, 400)).toBeNull();
  });

  it("returns null when shotIso is missing", () => {
    expect(pushPullStops(400, null)).toBeNull();
  });

  it("returns null when boxIso is zero or negative", () => {
    expect(pushPullStops(0, 400)).toBeNull();
    expect(pushPullStops(-100, 400)).toBeNull();
  });

  it("returns null when shotIso is zero or negative", () => {
    expect(pushPullStops(400, 0)).toBeNull();
    expect(pushPullStops(400, -100)).toBeNull();
  });
});

describe("formatPushPull", () => {
  it("formats 0 as \"0\"", () => {
    expect(formatPushPull(0)).toBe("0");
  });

  it("formats +1 stop", () => {
    expect(formatPushPull(1)).toBe("+1");
  });

  it("formats -1/3 stop with a true minus sign and vulgar fraction", () => {
    expect(formatPushPull(-1 / 3)).toBe("−⅓");
  });

  it("formats +2 stops", () => {
    expect(formatPushPull(2)).toBe("+2");
  });

  it("formats +1/3 stop", () => {
    expect(formatPushPull(1 / 3)).toBe("+⅓");
  });

  it("formats -2/3 stop", () => {
    expect(formatPushPull(-2 / 3)).toBe("−⅔");
  });

  it("formats +1 1/3 stops", () => {
    expect(formatPushPull(4 / 3)).toBe("+1⅓");
  });

  it("returns null when stops is null", () => {
    expect(formatPushPull(null)).toBeNull();
  });
});
