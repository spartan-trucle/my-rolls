import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The design system's phone block (`components/bundle.css`, `@media (max-width: 599px)`,
 * artifact `bd24`) sets a few literal sizes that the token re-pointing in tokens.css can't
 * reach. jsdom doesn't compute CSS Module values, so this reads each module's phone block.
 */
function phoneBlock(component: string): string {
  const file = path.join(import.meta.dirname, component, `${component}.module.css`);
  const css = readFileSync(file, "utf8");
  const start = css.indexOf("@media (max-width: 599px) {");
  expect(start, `${component} has no phone block`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1).replace(/\s+/g, " ");
  }
  throw new Error(`${component}: unclosed phone block`);
}

describe("phone sizes from the design system (under 600px)", () => {
  it("Button: 14px, small 13px, doodle 12px", () => {
    const css = phoneBlock("Button");
    expect(css).toMatch(/\.button \{[^}]*font-size: 14px;/);
    expect(css).toMatch(/\.sm \{[^}]*font-size: 13px;/);
    expect(css).toMatch(/\.doodle \{[^}]*font-size: 12px;/);
  });

  it("Field: mono input 13px", () => {
    expect(phoneBlock("Field")).toMatch(/\.mono \{[^}]*font-size: 13px;/);
  });

  it("UploadDrop: title 20/26", () => {
    expect(phoneBlock("UploadDrop")).toMatch(/\.title \{[^}]*font-size: 20px; line-height: 26px;/);
  });

  it("RollCard: compact grid, smaller can, name 17/22, meta 12/16", () => {
    const css = phoneBlock("RollCard");
    expect(css).toMatch(/\.card \{[^}]*grid-template-columns: 40px minmax\(0, 1fr\) auto; gap: var\(--space-3\);/);
    expect(css).toMatch(/\.can \{[^}]*zoom: 0?\.75;/);
    expect(css).toMatch(/\.name \{[^}]*font-size: 17px; line-height: 22px;/);
    expect(css).toMatch(/\.meta \{[^}]*font-size: 12px; line-height: 16px;/);
  });
});
