import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom doesn't implement matchMedia. Default to "no match" (light/reduced
// motion off); tests that care about a specific query (ThemeToggle) stub
// window.matchMedia themselves. Some suites (e.g. tokens-css.test.ts) opt
// into the node environment, where there is no window at all.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
