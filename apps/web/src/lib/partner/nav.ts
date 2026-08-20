import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Scissors,
  CalendarClock,
  ShoppingBag,
  Users,
  DollarSign,
  Star,
  Sparkles,
  Headphones,
  Building2,
} from "lucide-react";

export type PartnerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  requiresApproval: boolean;
};

export const PARTNER_NAV_ITEMS: PartnerNavItem[] = [
  { href: "/parceiro", label: "Visão geral", description: "Operação do dia", icon: LayoutDashboard, requiresApproval: false },
  { href: "/partner/products", label: "Produtos", description: "Catálogo e estoque", icon: Package, requiresApproval: true },
  { href: "/partner/services", label: "Serviços", description: "Ofertas e preços", icon: Scissors, requiresApproval: true },
  { href: "/partner/appointments", label: "Agenda", description: "Agendamentos", icon: CalendarClock, requiresApproval: true },
  { href: "/partner/orders", label: "Pedidos", description: "Vendas e fulfillment", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/customers", label: "Clientes", description: "Relacionamento operacional", icon: Users, requiresApproval: true },
  { href: "/partner/financeiro", label: "Financeiro", description: "GMV, comissão e payout", icon: DollarSign, requiresApproval: true },
  { href: "/partner/avaliacoes", label: "Avaliações", description: "Notas reais de clientes", icon: Star, requiresApproval: true },
  { href: "/partner/eccopet", label: "IA", description: "EccoPet Business AI", icon: Sparkles, requiresApproval: true },
  { href: "/dashboard/support", label: "Suporte", description: "Tickets B2B", icon: Headphones, requiresApproval: false },
  { href: "/partner/profile", label: "Perfil", description: "Público e operacional", icon: Building2, requiresApproval: false },
];

export function isPartnerNavActive(pathname: string, href: string): boolean {
  if (href === "/parceiro") return pathname === "/parceiro";
  return pathname === href || pathname.startsWith(`${href}/`);
}
