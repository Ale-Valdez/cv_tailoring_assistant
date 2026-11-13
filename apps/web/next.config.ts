import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";
const monorepoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const watchPoll = Number(process.env.WATCH_POLL_INTERVAL_MS);
const watchOptions =
  Number.isInteger(watchPoll) && watchPoll > 0 ? { pollIntervalMs: watchPoll } : undefined;

const nextConfig: NextConfig = {
  agentRules: false,
  ...(watchOptions === undefined ? {} : { watchOptions }),
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  // 10 MiB, el mismo tope que MAX_PDF_BYTES (ADR-020). El default del proxy es 10 MB decimales.
  experimental: {
    proxyClientMaxBodySize: 10 * 1024 * 1024,
  },
  transpilePackages: ["@cv-tailor/contracts", "@cv-tailor/domain"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
