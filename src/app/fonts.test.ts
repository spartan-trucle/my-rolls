import { describe, expect, it, vi } from "vitest";
import { FONT_VARIABLES } from "@/design-system/tokens/build";

type LoaderOptions = { variable: string; subsets: string[] };
const calls = vi.hoisted(() => [] as Array<{ family: string; options: LoaderOptions }>);

vi.mock("next/font/google", () => {
  const loader = (family: string) => (options: LoaderOptions) => {
    calls.push({ family, options });
    return { variable: `var-${family}`, className: `cls-${family}`, style: { fontFamily: family } };
  };
  return {
    Fraunces: loader("Fraunces"),
    Be_Vietnam_Pro: loader("Be_Vietnam_Pro"),
    Space_Mono: loader("Space_Mono"),
    Patrick_Hand: loader("Patrick_Hand"),
  };
});

describe("fonts", () => {
  it("loads the four design-system families under the variables the tokens point at", async () => {
    const { fontVariables } = await import("./fonts");
    expect(calls.map((c) => c.options.variable).sort()).toEqual(Object.values(FONT_VARIABLES).sort());
    expect(fontVariables.split(" ")).toHaveLength(4);
  });

  it("includes Vietnamese glyphs in every family", async () => {
    await import("./fonts");
    for (const c of calls) expect(c.options.subsets, c.family).toContain("vietnamese");
  });
});
