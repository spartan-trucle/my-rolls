import { describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get })),
}));

// layout.tsx imports fonts.ts, which calls next/font/google; stub it the
// same way src/app/fonts.test.ts does so this test doesn't hit the network.
vi.mock("next/font/google", () => {
  const loader = () => () => ({ variable: "var-mock", className: "cls-mock", style: {} });
  return {
    Fraunces: loader(),
    Be_Vietnam_Pro: loader(),
    Space_Mono: loader(),
    Patrick_Hand: loader(),
  };
});

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("sets no data-theme on <html> when the theme cookie is absent (follow the system)", async () => {
    get.mockReturnValue(undefined);

    const element = await RootLayout({ children: <div />, params: Promise.resolve({}) });

    expect(element.props.lang).toBe("vi");
    expect(element.props["data-theme"]).toBeUndefined();
  });

  it("sets data-theme=dark on <html> from the theme cookie", async () => {
    get.mockReturnValue({ name: "theme", value: "dark" });

    const element = await RootLayout({ children: <div />, params: Promise.resolve({}) });

    expect(element.props["data-theme"]).toBe("dark");
  });

  it("sets data-theme=light on <html> from the theme cookie", async () => {
    get.mockReturnValue({ name: "theme", value: "light" });

    const element = await RootLayout({ children: <div />, params: Promise.resolve({}) });

    expect(element.props["data-theme"]).toBe("light");
  });
});
