import type { ProfileType, PostType } from "./types";

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  tutor: "Tutor",
  pet: "Pet",
  veterinarian: "Veterinário",
  clinic: "Clínica",
  ong: "ONG",
  petshop: "Pet Shop",
  provider: "Prestador",
  store: "Loja",
};

export const POST_TYPE_LABELS: Partial<Record<PostType, string>> = {
  ai_tip: "Dica IA",
  marketplace: "Marketplace",
  service: "Serviço",
  adoption: "Adoção",
  sponsored: "Patrocinado",
  poll: "Enquete",
};

export const SOCIAL_NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/social/reels", label: "Reels" },
  { href: "/social/explorar", label: "Explorar" },
  { href: "/social/stories", label: "Stories" },
  { href: "/social/tendencias", label: "Tendências" },
  { href: "/social/salvos", label: "Salvos" },
  { href: "/social/mensagens", label: "Mensagens" },
] as const;

export function formatSocialTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const UNSPLASH = {
  dog1: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  dog2: "https://images.unsplash.com/photo-1558787533-047ed6946526?w=800&q=80",
  cat1: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80",
  vet: "https://images.unsplash.com/photo-1628009368238-7bb8cfc3877f?w=800&q=80",
  shop: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
  product: "https://images.unsplash.com/photo-1589924691995-400dc9ecc392?w=800&q=80",
  grooming: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80",
  adoption: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80",
  park: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
  golden: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&q=80",
};
