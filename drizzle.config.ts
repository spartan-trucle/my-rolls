import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { resolveMigrationDatabaseUrl } from "./src/db/migration-env";

// Loads env the same way `next dev` does, so a local `pnpm db:generate` /
// `pnpm db:migrate` picks up `.env.development.local` (the Neon `dev`
// branch, D23) ahead of `.env.local`. Vercel's build injects real env vars
// directly, so there's nothing for this to load there — it's a no-op.
loadEnvConfig(process.cwd(), true);

export default defineConfig({
  dialect: "postgresql",
  // The barrel file, not a directory glob: a glob over `src/db/schema/`
  // would also load `auth.test.ts`, and drizzle-kit's CJS loader can't
  // import Vitest.
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    // Migrations always run over the direct (unpooled) connection (D10).
    url: resolveMigrationDatabaseUrl(process.env),
  },
});
