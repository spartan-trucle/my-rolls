import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/dev/errors", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is a 404 on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: DevErrorsPage } = await import("./page");
    expect(() => DevErrorsPage()).toThrow("NEXT_NOT_FOUND");
  });

  it("renders the throw button and a link to /api/dev/boom on preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: DevErrorsPage } = await import("./page");
    render(<DevErrorsPage />);

    expect(screen.getByRole("button", { name: /throw in browser/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\/api\/dev\/boom/i })).toHaveAttribute(
      "href",
      "/api/dev/boom",
    );
  });
});
