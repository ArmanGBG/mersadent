import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Note: `output: "standalone"` is intentionally NOT set.
  // We use `next start` which serves `public/` at runtime — this is what
  // lets the Liara Persistent Disk mounted at /app/public/uploads serve
  // freshly uploaded images without a rebuild.
};

export default nextConfig;
