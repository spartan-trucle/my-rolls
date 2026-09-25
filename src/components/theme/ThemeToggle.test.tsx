import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { ThemeToggle } from "./ThemeToggle";

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function clearThemeCookie() {
  document.cookie = "theme=; max-age=0; path=/";
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    clearThemeCookie();
    stubMatchMedia(false);
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    clearThemeCookie();
  });

  it("starts pressed (dark) when <html> already carries data-theme=dark", async () => {
    document.documentElement.setAttribute("data-theme", "dark");

    renderWithIntl(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Chuyển sang giao diện sáng" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("starts unpressed (light) when <html> already carries data-theme=light", async () => {
    document.documentElement.setAttribute("data-theme", "light");

    renderWithIntl(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Chuyển sang giao diện tối" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("follows the OS preference when no cookie/data-theme is set", async () => {
    stubMatchMedia(true);

    renderWithIntl(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Chuyển sang giao diện sáng" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("flips aria-pressed, the label, the attribute and the cookie on click, without a reload", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "light");
    renderWithIntl(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: "Chuyển sang giao diện tối" });

    await user.click(button);

    expect(screen.getByRole("button", { name: "Chuyển sang giao diện sáng" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
  });

  it("flips back to light on a second click", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "dark");
    renderWithIntl(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: "Chuyển sang giao diện sáng" });

    await user.click(button);

    expect(screen.getByRole("button", { name: "Chuyển sang giao diện tối" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.cookie).toContain("theme=light");
  });
});
