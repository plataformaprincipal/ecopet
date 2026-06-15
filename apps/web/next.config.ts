import type { NextConfig } from "next";
import {
  SECURITY_HEADERS,
  productionOnlyHeaders,
  contentSecurityPolicy,
} from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecopet/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    const headers = [
      ...SECURITY_HEADERS,
      ...productionOnlyHeaders(),
      { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    ];
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
