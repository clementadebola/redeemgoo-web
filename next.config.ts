import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // This forces the server and client to generate identical matching class names
    styledComponents: true,
  },
  // Keep any other configuration options you already have here...
};

export default nextConfig;