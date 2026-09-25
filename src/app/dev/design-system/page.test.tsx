import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/dev/design-system", () => {
  beforeEach(() => {
    // Avoid the toggle's matchMedia branch: the header's own state isn't under test here.
    document.documentElement.setAttribute("data-theme", "light");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    document.documentElement.removeAttribute("data-theme");
  });

  it("is a 404 on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: DesignSystemPage } = await import("./page");
    expect(() => DesignSystemPage()).toThrow("NEXT_NOT_FOUND");
  });

  it("renders on preview and locally", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: DesignSystemPage } = await import("./page");
    expect(() => DesignSystemPage()).not.toThrow();
  });

  it("shows the theme toggle in the header, so it can be eyeballed", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: DesignSystemPage } = await import("./page");
    renderWithIntl(<DesignSystemPage />);
    expect(
      await screen.findByRole("button", { name: "Chuyển sang giao diện tối" }),
    ).toBeInTheDocument();
  });
});
