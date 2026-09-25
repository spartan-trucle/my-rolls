import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // CLAUDE.md is curated project memory; don't let `next dev` append its agent-rules block.
  agentRules: false,
};

// Reads src/i18n/request.ts by convention (no path argument needed).
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
