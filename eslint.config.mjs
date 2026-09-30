import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Other agents' git worktrees under .claude/worktrees/ carry their own
    // checkout, node_modules and .next build output — never this repo's
    // lint scope.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
