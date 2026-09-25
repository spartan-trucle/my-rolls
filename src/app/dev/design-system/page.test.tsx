import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("/dev/design-system", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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
});
