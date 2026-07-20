import type { ProductionCheckItem } from "./types";

export function getSeoAuditChecks(): ProductionCheckItem[] {
  return [
    {
      id: "seo-robots",
      area: "SEO",
      title: "robots.txt",
      status: "PASS",
      detail: "app/robots.ts — bloqueia /api, /admin, checkout e dashboards.",
      href: "/robots.txt",
    },
    {
      id: "seo-sitemap",
      area: "SEO",
      title: "sitemap.xml",
      status: "PASS",
      detail: "app/sitemap.ts com rotas públicas.",
      href: "/sitemap.xml",
    },
    {
      id: "seo-metadata",
      area: "SEO",
      title: "Metadata / OpenGraph / Twitter",
      status: "PASS",
      detail: "Root layout com title template, OG, Twitter cards e icons.",
    },
    {
      id: "seo-manifest",
      area: "SEO",
      title: "PWA manifest",
      status: "PASS",
      detail: "manifest.webmanifest + appleWebApp metadata.",
      href: "/manifest.webmanifest",
    },
    {
      id: "seo-404",
      area: "SEO",
      title: "Páginas de erro",
      status: "PASS",
      detail: "not-found.tsx, error.tsx e global-error.tsx presentes.",
    },
    {
      id: "seo-schema",
      area: "SEO",
      title: "schema.org estruturado",
      status: "WARN",
      detail: "JSON-LD completo por página ainda parcial — evoluir marketplace/parceiros.",
    },
    {
      id: "seo-canonical",
      area: "SEO",
      title: "Canonical URLs",
      status: "MANUAL",
      detail: "Validar canonicals em páginas indexáveis no deploy.",
    },
  ];
}
