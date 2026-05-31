import type { LucideIcon } from "lucide-react";
import { Home, Compass, ShoppingBag, PawPrint, User } from "lucide-react";

export interface MainNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string[];
}

/** Navegação principal do super app ECOPET (5 abas) */
export const MAIN_NAV: MainNavItem[] = [
  {
    href: "/inicio",
    label: "Início",
    icon: Home,
    match: ["/inicio", "/feed", "/social/stories", "/social/reels", "/social/tendencias", "/social/post", "/social/salvos"],
  },
  {
    href: "/explorar",
    label: "Explorar",
    icon: Compass,
    match: ["/explorar", "/social/explorar", "/explore", "/veterinarios", "/clinicas", "/adocao"],
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    match: ["/marketplace"],
  },
  {
    href: "/meu-pet",
    label: "Meu Pet",
    icon: PawPrint,
    match: ["/meu-pet", "/pets", "/health", "/iot"],
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: User,
    match: ["/perfil", "/configuracoes", "/assinatura", "/agenda"],
  },
];

/** Links estratégicos ECOPET Health + ECOPET AI + módulos */
export const SECONDARY_NAV = [
  { href: "/health", label: "ECOPET Health", icon: "Heart" },
  { href: "/ia", label: "ECOPET AI", icon: "Sparkles" },
  { href: "/iot", label: "IoT ECOPET", icon: "Radio" },
  { href: "/agenda", label: "Agenda", icon: "Calendar" },
  { href: "/social/mensagens", label: "Mensagens", icon: "MessageCircle" },
  { href: "/notificacoes", label: "Notificações", icon: "Bell" },
  { href: "/agro", label: "Agro Inteligente", icon: "Sprout" },
  { href: "/social/reels", label: "Reels", icon: "Film" },
  { href: "/social/salvos", label: "Salvos", icon: "Bookmark" },
] as const;

export function isNavActive(pathname: string, item: MainNavItem) {
  return item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}
