// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import tokens from "../../../design-tokens/tokens.json";
import { buildTokensCss } from "./build";

it("src/styles/tokens.css matches design-tokens/tokens.json (run `pnpm tokens`)", () => {
  const committed = readFileSync(path.join(process.cwd(), "src/styles/tokens.css"), "utf8");
  expect(committed).toBe(buildTokensCss(tokens));
});
