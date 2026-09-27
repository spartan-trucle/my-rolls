import { describe, expect, it } from "vitest";
import { toSearchText } from "./search-text";

/**
 * D8: one function for write and query, so the two paths can't drift.
 * Written first (TDD) — `toSearchText()` follows.
 */
describe("toSearchText", () => {
  it("lowercases, strips diacritics (NFD) and maps đ/Đ to d", () => {
    expect(toSearchText("Đà Lạt")).toBe("da lat");
  });

  it("leaves plain ASCII lowercase, keeping spaces between words", () => {
    expect(toSearchText("Kodak Gold 200")).toBe("kodak gold 200");
  });

  it("keeps + (Ilford HP5+ matters as a distinct stock from HP5)", () => {
    expect(toSearchText("Ilford HP5+")).toBe("ilford hp5+");
  });

  it("collapses repeated whitespace and trims the ends", () => {
    expect(toSearchText("  Fujifilm   Superia  ")).toBe("fujifilm superia");
  });

  it("maps every Vietnamese diacritic mark, not only Đ", () => {
    expect(toSearchText("Hà Nội")).toBe("ha noi");
    expect(toSearchText("Đà Nẵng")).toBe("da nang");
    expect(toSearchText("Tự tráng ở nhà")).toBe("tu trang o nha");
  });

  it("is idempotent — running it twice gives the same result", () => {
    const once = toSearchText("Đà Lạt");
    expect(toSearchText(once)).toBe(once);
  });
});
