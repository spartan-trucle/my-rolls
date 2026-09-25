import { describe, expect, it } from "vitest";
import tokens from "../../../design-tokens/tokens.json";
import { contrastRatio, relativeLuminance } from "./contrast";
import type { Theme, TokensFile } from "./types";

const file: TokensFile = tokens;

function colour(name: string, theme: Theme): string {
  const token = file.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`No colour token "${name}"`);
  const alias = /^\{([a-z0-9-]+)\}$/.exec(token.value[theme]);
  return alias ? colour(alias[1], theme) : token.value[theme];
}

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#2e3a80", "#2e3a80")).toBe(1);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#1f1a16", "#f2ede4")).toBe(contrastRatio("#f2ede4", "#1f1a16"));
  });

  it("rejects colours that are not #rrggbb", () => {
    expect(() => relativeLuminance("rgba(0, 0, 0, 0.5)")).toThrow(/#rrggbb/);
  });
});

// [foreground, background, minimum ratio]: text pairs are 4.5 (AA), control edges and focus 3.
const PAIRS: Array<[string, string, number]> = [
  ["ink", "paper", 4.5], ["ink", "paper-raised", 4.5], ["ink", "scrap", 4.5],
  ["ink-muted", "paper", 4.5], ["ink-muted", "paper-raised", 4.5], ["ink-muted", "scrap", 4.5],
  ["cobalt", "paper", 4.5], ["cobalt", "paper-raised", 4.5], ["cobalt", "cobalt-soft", 4.5],
  ["on-cobalt", "cobalt", 7],
  ["focus", "paper", 3], ["focus", "paper-raised", 3],
  ["line-strong", "paper", 3], ["line-strong", "paper-raised", 3],
  ["pin", "paper", 4.5], ["pin", "paper-raised", 4.5], ["pin", "pin-soft", 4.5], ["pin", "scrap", 4.5],
  ["keeper", "paper", 4.5], ["keeper", "paper-raised", 4.5], ["keeper", "scrap", 4.5],
  ["on-print", "print", 4.5], ["on-print-muted", "print", 4.5], ["on-print-pin", "print", 4.5],
  ["on-pin", "pin", 4.5], ["on-keeper", "keeper", 4.5],
  ["film-edge", "film", 4.5],
];

describe.each<Theme>(["light", "dark"])("token contrast (%s)", (theme) => {
  it.each(PAIRS)("%s on %s is at least %d:1", (fg, bg, min) => {
    expect(contrastRatio(colour(fg, theme), colour(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});
