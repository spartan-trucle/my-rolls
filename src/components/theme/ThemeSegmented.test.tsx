import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { ThemeSegmented } from "./ThemeSegmented";

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

describe("ThemeSegmented", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    clearThemeCookie();
    stubMatchMedia(false);
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    clearThemeCookie();
  });

  it("renders a Sáng / Tối group with the current theme pressed", async () => {
    document.documentElement.setAttribute("data-theme", "light");

    renderWithIntl(<ThemeSegmented />);

    expect(await screen.findByRole("button", { name: "Sáng" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tối" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to dark, flips the attribute and the cookie, without a reload", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "light");
    renderWithIntl(<ThemeSegmented />);

    await user.click(await screen.findByRole("button", { name: "Tối" }));

    expect(screen.getByRole("button", { name: "Tối" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
  });

  it("switches back to light", async () => {
    const user = userEvent.setup();
    document.documentElement.setAttribute("data-theme", "dark");
    renderWithIntl(<ThemeSegmented />);

    await user.click(await screen.findByRole("button", { name: "Sáng" }));

    expect(screen.getByRole("button", { name: "Sáng" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.cookie).toContain("theme=light");
  });

  it("is a labelled group", async () => {
    renderWithIntl(<ThemeSegmented />);

    expect(await screen.findByRole("group", { name: "Giao diện" })).toBeInTheDocument();
  });
});
