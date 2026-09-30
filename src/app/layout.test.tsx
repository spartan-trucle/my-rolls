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

import RootLayout, { viewport } from "./layout";

describe("viewport", () => {
  // Design system bd24: inputs are 14px on phones, and iOS Safari zooms into inputs under 16px.
  it("stops iOS focus zoom with maximum-scale=1", () => {
    expect(viewport).toMatchObject({ width: "device-width", initialScale: 1, maximumScale: 1 });
  });
});

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";

/** Depth-first search of a rendered element tree for an element of `type`. */
function findElement(node: ReactNode, type: unknown): ReactElement<{ children?: ReactNode }> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (node.type === type) return node;
  const children = node.props.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findElement(child, type);
    if (found) return found;
  }
  return null;
}

describe("RootLayout", () => {
  it("wraps every page in one UploadProvider, so the queue survives Home ↔ roll navigation (Phase 2 D16)", async () => {
    get.mockReturnValue(undefined);
    const child = <div data-testid="page" />;

    const element = await RootLayout({ children: child, params: Promise.resolve({}) });

    const provider = findElement(element, UploadProvider);
    expect(provider).not.toBeNull();
    expect(findElement(provider!.props.children, "div")).toBe(child);
  });

  it("sets no data-theme on <html> when the theme cookie is absent (follow the system)", async () => {
    get.mockReturnValue(undefined);

    const element = await RootLayout({ children: <div />, params: Promise.resolve({}) });

    expect(element.props.lang).toBe("vi");
    expect(element.props["data-theme"]).toBeUndefined();
  });

  it("lets Next.js turn off smooth scrolling during route changes", async () => {
    get.mockReturnValue(undefined);

    const element = await RootLayout({ children: <div />, params: Promise.resolve({}) });

    expect(element.props["data-scroll-behavior"]).toBe("smooth");
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
