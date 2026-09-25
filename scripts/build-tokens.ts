import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import tokens from "../design-tokens/tokens.json";
import { buildTokensCss } from "../src/design-system/tokens/build";

const out = path.join(process.cwd(), "src/styles/tokens.css");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, buildTokensCss(tokens));
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
