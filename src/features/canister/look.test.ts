import { describe, expect, it } from "vitest";
import { canisterFill, isCanisterColor, resolveCanisterLook } from "./look";

describe("isCanisterColor (D1)", () => {
  it("accepts the 8 preset slugs and lowercase #rrggbb", () => {
    for (const v of ["gold", "green", "blue", "rose", "red", "orange", "mono", "cream", "#a1b2c3"]) {
      expect(isCanisterColor(v)).toBe(true);
    }
  });

  it("rejects anything that could break out of a style attribute", () => {
    for (const v of ["#ABC123", "#abc", "red;background:url(x)", "var(--ink)", "", "purple", "#abc1234"]) {
      expect(isCanisterColor(v)).toBe(false);
    }
  });
});

describe("canisterFill", () => {
  it("maps a preset to its token and passes a hex through", () => {
    expect(canisterFill("cream")).toBe("var(--stock-cream)");
    expect(canisterFill("#a1b2c3")).toBe("#a1b2c3");
  });

  it("falls back to gold for null or an unsafe value", () => {
    expect(canisterFill(null)).toBe("var(--stock-gold)");
    expect(canisterFill("red;color:x")).toBe("var(--stock-gold)");
  });
});

describe("resolveCanisterLook (D2, blocker 4)", () => {
  const base = { rollColor: "#123456", stockColor: "green", stockPhotoUrl: null };

  it("stock style follows the stock's colour, not the roll's copy", () => {
    expect(resolveCanisterLook({ ...base, style: "stock" })).toEqual({ kind: "drawn", fill: "var(--stock-green)" });
  });

  it("drawn style uses the roll's colour", () => {
    expect(resolveCanisterLook({ ...base, style: "drawn" })).toEqual({ kind: "drawn", fill: "#123456" });
  });

  it("photo style shows the photo, with the stock colour behind it", () => {
    expect(resolveCanisterLook({ ...base, style: "photo", stockPhotoUrl: "https://img/c.webp" })).toEqual({
      kind: "photo",
      src: "https://img/c.webp",
      fill: "var(--stock-green)",
    });
  });

  it("photo style without a photo falls back to the drawn stock colour", () => {
    expect(resolveCanisterLook({ ...base, style: "photo" })).toEqual({ kind: "drawn", fill: "var(--stock-green)" });
  });
});
