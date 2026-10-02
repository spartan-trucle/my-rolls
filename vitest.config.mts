import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Files that call `createTestDb()` (src/db/test-db.ts) — PGlite-backed,
// B2–B6 data-layer suites. `core.test.ts` covers the per-feature `*core.ts`
// suites added on later phase-1 branches (bag, catalogue, labs, rolls).
const PGLITE_TEST_GLOBS = [
  "src/db/test-db.test.ts",
  "src/**/core.test.ts",
  "src/**/queries.test.ts",
  "src/lib/search-text.integration.test.ts",
  "src/db/schema/scans.test.ts",
  "src/db/schema/notes.test.ts",
  "src/features/uploads/cleanup.test.ts",
  "scripts/seed-catalogue.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // See vitest.server-only-stub.ts: keeps `import "server-only"` from
      // throwing under Vitest, which has no server/client bundler split.
      "server-only": path.resolve(import.meta.dirname, "vitest.server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // CSS Modules resolve to their plain class names (styles.primary === "primary").
    css: { include: [/\.module\.css$/], modules: { classNameStrategy: "non-scoped" } },
    // The PGlite-backed suites (D21) get their own project so a slow first
    // `createTestDb()` per worker (PGlite boot + migrations) doesn't need
    // the whole unit-test suite's timeout raised — see src/db/test-db.ts.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
          exclude: [...PGLITE_TEST_GLOBS],
        },
      },
      {
        extends: true,
        test: {
          name: "pglite",
          include: [...PGLITE_TEST_GLOBS],
          testTimeout: 20_000,
        },
      },
    ],
  },
});
