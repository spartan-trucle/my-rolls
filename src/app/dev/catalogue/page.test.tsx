import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/dev/catalogue", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is a 404 on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: CataloguePage } = await import("./page");
    expect(() => CataloguePage()).toThrow("NEXT_NOT_FOUND");
  });

  it("renders on preview and locally, with a button to open the picker", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: CataloguePage } = await import("./page");
    renderWithIntl(<CataloguePage />);

    expect(await screen.findByRole("button", { name: "Mở danh mục" })).toBeInTheDocument();
  });
});
