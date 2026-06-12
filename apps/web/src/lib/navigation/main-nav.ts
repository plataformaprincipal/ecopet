import type { LucideIcon } from "lucide-react";
import { Home, Compass, ShoppingBag, PawPrint, User } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

export interface MainNavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  match: string[];
}

/** Navegação principal do super app ECOPET (5 abas) */
export const MAIN_NAV: MainNavItem[] = [
  {
    href: "/inicio",
    labelKey: "nav.home",
    icon: Home,
    match: ["/inicio", "/feed", "/social/stories", "/social/reels", "/social/tendencias", "/social/post", "/social/salvos"],
  },
  {
    href: "/explorar",
    labelKey: "nav.explore",
    icon: Compass,
    match: ["/explorar", "/social/explorar", "/explore", "/veterinarios", "/clinicas", "/adocao"],
  },
  {
    href: "/marketplace",
    labelKey: "nav.marketplace",
    icon: ShoppingBag,
    match: ["/marketplace"],
  },
  {
    href: "/meu-pet",
    labelKey: "nav.myPet",
    icon: PawPrint,
    match: ["/meu-pet", "/pets", "/health", "/iot"],
  },
  {
    href: "/perfil",
    labelKey: "nav.profile",
    icon: User,
    match: ["/perfil", "/configuracoes", "/assinatura", "/agenda"],
  },
];

/** Links estratégicos ECOPET Health + ECOPET AI + módulos */
export const SECONDARY_NAV: { href: string; labelKey: TranslationKey; icon: string }[] = [
  { href: "/health", labelKey: "nav.health", icon: "Heart" },
  { href: "/ia", labelKey: "nav.ai", icon: "Sparkles" },
  { href: "/iot", labelKey: "nav.iot", icon: "Radio" },
  { href: "/agenda", labelKey: "nav.agenda", icon: "Calendar" },
  { href: "/social/mensagens", labelKey: "nav.messages", icon: "MessageCircle" },
  { href: "/notificacoes", labelKey: "nav.notifications", icon: "Bell" },
  { href: "/agro", labelKey: "nav.agro", icon: "Sprout" },
  { href: "/social/reels", labelKey: "nav.reels", icon: "Film" },
  { href: "/social/salvos", labelKey: "nav.saved", icon: "Bookmark" },
];

export function isNavActive(pathname: string, item: MainNavItem) {
  return item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

/** Chaves de tradução para navegação do marketplace */
export const MARKETPLACE_NAV_KEYS = [
  { href: "/marketplace", labelKey: "nav.home" as TranslationKey },
  { href: "/marketplace/produtos", labelKey: "nav.products" as TranslationKey },
  { href: "/marketplace/servicos", labelKey: "nav.services" as TranslationKey },
  { href: "/marketplace/personalizados", labelKey: "nav.custom" as TranslationKey },
  { href: "/marketplace/orcamentos", labelKey: "nav.quotes" as TranslationKey },
  { href: "/marketplace/chat", labelKey: "nav.chat" as TranslationKey },
  { href: "/marketplace/favoritos", labelKey: "nav.favorites" as TranslationKey },
  { href: "/marketplace/busca", labelKey: "nav.search" as TranslationKey },
] as const;
