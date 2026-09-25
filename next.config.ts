import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // CLAUDE.md is curated project memory; don't let `next dev` append its agent-rules block.
  agentRules: false,
  images: {
    // Google's avatar CDN, for the sign-up profile step (Stage F): `next/image`
    // refuses an external source unless it's explicitly allow-listed.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

// Reads src/i18n/request.ts by convention (no path argument needed).
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
