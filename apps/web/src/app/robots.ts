import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://ecopet-web.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Áreas autenticadas / privadas não devem ser indexadas.
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/gestor",
          "/partner",
          "/ngo",
          "/client",
          "/configuracoes",
          "/carrinho",
          "/checkout",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
