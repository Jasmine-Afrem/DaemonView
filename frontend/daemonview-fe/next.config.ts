import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true, // ✅ Enables SSR support for styled-components
  },
};

export default nextConfig;
