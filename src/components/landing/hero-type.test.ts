import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Design system bd24: the hero headline drops to display-l (40/44) under 600px. tokens.css
// re-points --text-display-hero on phones, so the headline uses display-hero at every width.
describe("landing hero headline", () => {
  it("uses display-hero at every width, not display-xl on phones", () => {
    const css = readFileSync(path.join(import.meta.dirname, "Hero.module.css"), "utf8");
    const base = css.slice(css.indexOf(".headline {"), css.indexOf("}", css.indexOf(".headline {")));
    expect(base).toContain("font-size: var(--text-display-hero);");
    expect(base).not.toContain("--text-display-xl");
  });
});
