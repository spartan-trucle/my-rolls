import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
    // CSS Modules resolve to their plain class names (styles.primary === "primary").
    css: { include: [/\.module\.css$/], modules: { classNameStrategy: "non-scoped" } },
  },
});
