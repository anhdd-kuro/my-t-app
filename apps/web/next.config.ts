import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: "Asia/Tokyo",
  },
  // Standalone mode
  output: "standalone",
};

export default nextConfig;
