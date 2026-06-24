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
  async redirects() {
    return [
      { source: "/partner/dashboard", destination: "/dashboard/partner", permanent: false },
      { source: "/partner/products", destination: "/dashboard/partner/products", permanent: false },
      { source: "/partner/products/new", destination: "/dashboard/partner/products/new", permanent: false },
      {
        source: "/partner/products/:productId/edit",
        destination: "/dashboard/partner/products/:productId/edit",
        permanent: false,
      },
      { source: "/partner/services", destination: "/dashboard/partner/services", permanent: false },
      { source: "/partner/services/new", destination: "/dashboard/partner/services/new", permanent: false },
      {
        source: "/partner/services/:serviceId/edit",
        destination: "/dashboard/partner/services/:serviceId/edit",
        permanent: false,
      },
      { source: "/partner/orders", destination: "/dashboard/partner/orders", permanent: false },
      { source: "/partner/appointments", destination: "/dashboard/partner/appointments", permanent: false },
      { source: "/explore", destination: "/explorar", permanent: false },
    ];
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
