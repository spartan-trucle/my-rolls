import { describe, expect, it } from "vitest";
import { themeCookieToDataTheme } from "./theme";

describe("themeCookieToDataTheme", () => {
  it("returns undefined when the cookie is absent, so the system decides", () => {
    expect(themeCookieToDataTheme(undefined)).toBeUndefined();
  });

  it('returns "dark" for the dark cookie', () => {
    expect(themeCookieToDataTheme("dark")).toBe("dark");
  });

  it('returns "light" for the light cookie', () => {
    expect(themeCookieToDataTheme("light")).toBe("light");
  });

  it("returns undefined for any other value, so the system decides", () => {
    expect(themeCookieToDataTheme("sepia")).toBeUndefined();
    expect(themeCookieToDataTheme("")).toBeUndefined();
  });
});
