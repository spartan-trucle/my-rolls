import { describe, expect, it } from "vitest";
import { resolveLibraryView, resolveRollView } from "./view-pref";

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
