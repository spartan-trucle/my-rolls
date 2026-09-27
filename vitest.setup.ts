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

// jsdom reflects <dialog>'s `open` attribute but has never implemented
// showModal()/close() themselves (https://github.com/jsdom/jsdom/issues/3294).
// ResponsiveDialog (D1) calls both directly, so stub them here rather than in
// every test: showModal sets `open` (jsdom's real getter/setter already
// handles the attribute), close clears it and fires the native "close" event
// ResponsiveDialog listens for, same as a real browser.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
