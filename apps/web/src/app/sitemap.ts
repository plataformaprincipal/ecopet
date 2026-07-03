import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "https://ecopet-web.vercel.app";

// Rotas públicas estáticas. Rotas dinâmicas (produtos, pets, ONGs) podem ser
// adicionadas posteriormente via consultas, mantendo este arquivo simples.
const PUBLIC_ROUTES = [
  "",
  "/login",
  "/cadastro",
  "/marketplace",
  "/explorar",
  "/social",
  "/adoption",
  "/campaigns",
  "/produtos",
  "/servicos",
  "/veterinarios",
  "/clinicas",
  "/adocao",
  "/termos",
  "/privacidade",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route || "/"}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
