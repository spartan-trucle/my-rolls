import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is curated project memory; don't let `next dev` append its agent-rules block.
  agentRules: false,
};

export default nextConfig;
