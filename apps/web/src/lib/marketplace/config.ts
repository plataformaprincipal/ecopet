import type { SortOption } from "./types";

export const MP_IMAGES = {
  product: "https://images.unsplash.com/photo-1589924691995-400dc9ecc392?w=600&q=80",
  food: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80",
  toy: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&q=80",
  grooming: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80",
  vet: "https://images.unsplash.com/photo-1628009368238-7bb8cfc3877f?w=600&q=80",
  shop: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
  bed: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
  transport: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
};

export const PRODUCT_CATEGORIES = [
  { slug: "racoes", label: "Rações", icon: "🍖" },
  { slug: "petiscos", label: "Petiscos", icon: "🦴" },
  { slug: "acessorios", label: "Acessórios", icon: "🎀" },
  { slug: "brinquedos", label: "Brinquedos", icon: "🎾" },
  { slug: "higiene", label: "Higiene", icon: "🛁" },
  { slug: "saude", label: "Saúde", icon: "💊" },
  { slug: "medicamentos", label: "Medicamentos OTC", icon: "💉" },
  { slug: "camas", label: "Camas", icon: "🛏️" },
  { slug: "coleiras", label: "Coleiras", icon: "🦮" },
  { slug: "roupas", label: "Roupas", icon: "👕" },
  { slug: "transporte", label: "Transporte", icon: "🚗" },
  { slug: "assinatura", label: "Assinatura pet", icon: "📦" },
];

export const SERVICE_CATEGORIES = [
  { slug: "banho-tosa", label: "Banho e tosa" },
  { slug: "consulta-vet", label: "Consulta veterinária" },
  { slug: "vacinacao", label: "Vacinação" },
  { slug: "dog-walker", label: "Dog walker" },
  { slug: "pet-sitter", label: "Pet sitter" },
  { slug: "adestramento", label: "Adestramento" },
  { slug: "hospedagem", label: "Hospedagem" },
  { slug: "creche", label: "Creche pet" },
  { slug: "transporte", label: "Transporte pet" },
  { slug: "fotografia", label: "Fotografia pet" },
  { slug: "teleorientacao", label: "Teleorientação" },
  { slug: "emergencia", label: "Emergência pet" },
];

export const HOME_CATEGORIES = [
  { slug: "produtos", label: "Produtos", href: "/marketplace/produtos", icon: "📦", color: "from-ecopet-green/20 to-ecopet-green/5" },
  { slug: "servicos", label: "Serviços", href: "/marketplace/servicos", icon: "🔧", color: "from-amber-500/20 to-amber-500/5" },
  { slug: "saude", label: "Saúde", href: "/marketplace/servicos?cat=consulta-vet", icon: "❤️", color: "from-rose-500/20 to-rose-500/5" },
  { slug: "adocao", label: "Adoção", href: "/adocao", icon: "🏠", color: "from-pink-500/20 to-pink-500/5" },
  { slug: "assinaturas", label: "Assinaturas", href: "/marketplace/produtos?sub=1", icon: "🔄", color: "from-violet-500/20 to-violet-500/5" },
  { slug: "parceiros", label: "Parceiros", href: "/marketplace/busca?type=partner", icon: "🤝", color: "from-sky-500/20 to-sky-500/5" },
  { slug: "personalizado", label: "Personalizado", href: "/marketplace/personalizados", icon: "✨", color: "from-ecopet-yellow/30 to-ecopet-yellow/5" },
];

export const MARKETPLACE_NAV = [
  { href: "/marketplace", label: "Início" },
  { href: "/marketplace/produtos", label: "Produtos" },
  { href: "/marketplace/servicos", label: "Serviços" },
  { href: "/marketplace/personalizados", label: "Personalizado" },
  { href: "/marketplace/orcamentos", label: "Orçamentos" },
  { href: "/marketplace/chat", label: "Chat" },
  { href: "/marketplace/favoritos", label: "Favoritos" },
  { href: "/marketplace/busca", label: "Busca" },
] as const;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "rating", label: "Maior avaliação" },
  { value: "distance", label: "Mais próximos" },
  { value: "bestseller", label: "Mais vendidos" },
  { value: "ai", label: "Recomendados pela IA" },
  { value: "newest", label: "Mais recentes" },
];

export const AI_TAG_LABELS: Record<string, string> = {
  best_for_pet: "Melhor para seu pet",
  safest: "Mais seguro",
  best_value: "Melhor custo-benefício",
  partner_pick: "Parceiro recomendado",
  ideal_today: "Serviço ideal para hoje",
  ai_pick: "Escolha IA",
  recommended: "Recomendado",
  combo: "Combo inteligente",
};

export function formatMpPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function discountPct(price: number, compare?: number) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}
