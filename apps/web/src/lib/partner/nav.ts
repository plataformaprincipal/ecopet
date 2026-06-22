import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Store,
  CalendarClock,
  UsersRound,
  Settings2,
} from "lucide-react";

export type PartnerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const PARTNER_NAV_ITEMS: PartnerNavItem[] = [
  {
    href: "/parceiro/comunidade",
    label: "Comunidade EcoPet",
    description: "Feed do ecossistema pet",
    icon: UsersRound,
    requiresApproval: false,
  },
  {
    href: "/parceiro/marketplace",
    label: "Vitrine e Marketplace",
    description: "Produtos e catálogo",
    icon: Store,
    requiresApproval: true,
  },
  {
    href: "/parceiro/agenda-servicos",
    label: "Agenda e Serviços",
    description: "Agendamentos e serviços",
    icon: CalendarClock,
    requiresApproval: true,
  },
  {
    href: "/parceiro/atividades-ia",
    label: "Minhas Atividades com IA",
    description: "Painel inteligente",
    icon: Sparkles,
    requiresApproval: true,
  },
  {
    href: "/parceiro/perfil-gestao",
    label: "Perfil e Gestão",
    description: "Dados e configurações",
    icon: Settings2,
    requiresApproval: false,
  },
];

export function isPartnerNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
