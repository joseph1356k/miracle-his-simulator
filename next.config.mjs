import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is a synthetic, test-only simulator. Keep builds resilient so the
  // large surface area of screens always boots for UI-automation testing.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  // A parent-folder lockfile exists; pin tracing root to this project.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
