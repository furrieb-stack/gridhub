import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "gridhub-backend.onrender.com" },
    ],
  },
};

export default nextConfig;