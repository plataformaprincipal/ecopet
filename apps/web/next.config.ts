import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecopet/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
