import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix deployment issue: Explicitly set output tracing root to project directory
  // This prevents Next.js from tracing files from parent directories
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
