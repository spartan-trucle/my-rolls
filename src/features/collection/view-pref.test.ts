import { describe, expect, it } from "vitest";
import { resolveLibraryView, resolveRollView, viewCookie } from "./view-pref";

describe("resolveRollView (D6, D7)", () => {
  it("the URL wins over the cookie", () => {
    expect(resolveRollView("grid", "strip")).toBe("grid");
  });

  it("the cookie is used when the URL has no view, and strip is the default", () => {
    expect(resolveRollView(undefined, "grid")).toBe("grid");
    expect(resolveRollView(undefined, undefined)).toBe("strip");
  });

  it("garbage in the URL or the cookie falls back", () => {
    expect(resolveRollView("shelf", "<script>")).toBe("strip");
  });
});

describe("resolveLibraryView", () => {
  it("defaults to shelf and accepts grid", () => {
    expect(resolveLibraryView(undefined, undefined)).toBe("shelf");
    expect(resolveLibraryView(undefined, "grid")).toBe("grid");
    expect(resolveLibraryView("strip", undefined)).toBe("shelf");
  });
});

describe("viewCookie (Ruling R31)", () => {
  it("remembers a view for a year, site-wide, lax", () => {
    expect(viewCookie("roll", "grid")).toBe("cuon_roll_view=grid; max-age=31536000; path=/; samesite=lax");
    expect(viewCookie("library", "grid")).toBe("cuon_library_view=grid; max-age=31536000; path=/; samesite=lax");
  });

  it("stores the default instead of a forged view", () => {
    expect(viewCookie("roll", "<script>;path=/x")).toBe("cuon_roll_view=strip; max-age=31536000; path=/; samesite=lax");
    expect(viewCookie("library", "strip")).toBe("cuon_library_view=shelf; max-age=31536000; path=/; samesite=lax");
  });
});
