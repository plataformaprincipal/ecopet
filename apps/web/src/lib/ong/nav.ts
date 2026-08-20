import type { LucideIcon } from "lucide-react";
import { Home, PawPrint, Heart, Users, Megaphone, Settings2, Headphones } from "lucide-react";

export type OngNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const ONG_NAV_ITEMS: OngNavItem[] = [
  { href: "/ong", label: "Visão geral", description: "Dashboard da ONG", icon: Home, requiresApproval: false },
  { href: "/ngo/animais", label: "Animais", description: "Cadastro e disponibilidade", icon: PawPrint, requiresApproval: true },
  { href: "/ong/adocoes", label: "Adoções", description: "Processos em andamento", icon: Heart, requiresApproval: true },
  { href: "/ngo/adocoes", label: "Interessados", description: "Solicitações humanas", icon: Users, requiresApproval: true },
  { href: "/ngo/campanhas", label: "Campanhas", description: "Campanhas reais", icon: Megaphone, requiresApproval: true },
  { href: "/ong/perfil-gestao", label: "Perfil", description: "Público e operacional", icon: Settings2, requiresApproval: false },
  { href: "/dashboard/support", label: "Suporte", description: "Tickets da ONG", icon: Headphones, requiresApproval: false },
];

export function isOngNavActive(pathname: string, href: string): boolean {
  if (href === "/ong") return pathname === "/ong";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isOngAreaPath(pathname: string): boolean {
  return pathname === "/ong" || pathname.startsWith("/ong/") || pathname === "/ngo" || pathname.startsWith("/ngo/");
}
