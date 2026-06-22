import type { LucideIcon } from "lucide-react";
import { Home, UsersRound, Heart, Sparkles, Settings2 } from "lucide-react";

export type OngNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const ONG_NAV_ITEMS: OngNavItem[] = [
  {
    href: "/ong",
    label: "Início",
    description: "Dashboard da ONG",
    icon: Home,
    requiresApproval: false,
  },
  {
    href: "/ong/comunidade",
    label: "Comunidade",
    description: "Divulgação e posts",
    icon: UsersRound,
    requiresApproval: true,
  },
  {
    href: "/ong/adocoes",
    label: "Adoções",
    description: "Animais e solicitações",
    icon: Heart,
    requiresApproval: true,
  },
  {
    href: "/ong/atividades-ia",
    label: "Atividades com IA",
    description: "Painel inteligente",
    icon: Sparkles,
    requiresApproval: true,
  },
  {
    href: "/ong/perfil-gestao",
    label: "Perfil e Gestão",
    description: "Conta e documentos",
    icon: Settings2,
    requiresApproval: false,
  },
];

export function isOngNavActive(pathname: string, href: string): boolean {
  if (href === "/ong") return pathname === "/ong";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isOngAreaPath(pathname: string): boolean {
  return pathname === "/ong" || pathname.startsWith("/ong/");
}
