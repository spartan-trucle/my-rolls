import { describe, expect, it } from "vitest";
import { shouldHideShellChrome } from "./hidden-routes";

describe("shouldHideShellChrome", () => {
  it("hides on /rolls/new", () => {
    expect(shouldHideShellChrome("/rolls/new")).toBe(true);
  });

  it("hides on a roll page (/rolls/[id])", () => {
    expect(shouldHideShellChrome("/rolls/abc-123")).toBe(true);
  });

  it("hides on a roll edit page (/rolls/[id]/edit)", () => {
    expect(shouldHideShellChrome("/rolls/abc-123/edit")).toBe(true);
  });

  it("keeps the shell on the shelf, bag, and profile routes", () => {
    expect(shouldHideShellChrome("/")).toBe(false);
    expect(shouldHideShellChrome("/bag")).toBe(false);
    expect(shouldHideShellChrome("/profile")).toBe(false);
  });
});
