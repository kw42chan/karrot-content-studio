import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability"],
  async redirects() {
    return [
      { source: "/posts", destination: "/p", permanent: false },
      { source: "/posts/:slug", destination: "/p/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
