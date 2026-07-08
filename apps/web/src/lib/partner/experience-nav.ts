import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Scissors,
  ShoppingBag,
  CalendarDays,
  UsersRound,
  MessageSquare,
  Bell,
  Sparkles,
  Building2,
  Settings,
  DollarSign,
  Calculator,
  Briefcase,
  Target,
  TrendingUp,
  BarChart3,
  Users2,
  Scale,
  ClipboardList,
  Truck,
  Shield,
  Building,
  Server,
  Wrench,
  Cpu,
  Workflow,
  Megaphone,
  Heart,
  Gift,
  Stethoscope,
  ShoppingCart,
  Plug,
  FlaskConical,
  Handshake,
} from "lucide-react";

export type PartnerExperienceNavItem = {
  href: string;
  /** Chave i18n em partnerArea.nav.* */
  labelKey: string;
  icon: LucideIcon;
  /** Exige parceiro aprovado (accessLevel "full"). */
  requiresApproval: boolean;
};

/** Navegação completa do painel do parceiro (/partner/*). */
export const PARTNER_EXPERIENCE_NAV: PartnerExperienceNavItem[] = [
  { href: "/partner", labelKey: "partnerArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/partner/dashboard", labelKey: "partnerArea.nav.dashboard", icon: BarChart3, requiresApproval: true },
  { href: "/partner/financeiro", labelKey: "partnerArea.nav.financeiro", icon: DollarSign, requiresApproval: true },
  { href: "/partner/contabil", labelKey: "partnerArea.nav.contabil", icon: Calculator, requiresApproval: true },
  { href: "/partner/comercial", labelKey: "partnerArea.nav.comercial", icon: Briefcase, requiresApproval: true },
  { href: "/partner/crm", labelKey: "partnerArea.nav.crm", icon: Users, requiresApproval: true },
  { href: "/partner/vendas", labelKey: "partnerArea.nav.vendas", icon: TrendingUp, requiresApproval: true },
  { href: "/partner/analytics", labelKey: "partnerArea.nav.analytics", icon: Target, requiresApproval: true },
  { href: "/partner/rh", labelKey: "partnerArea.nav.rh", icon: Users2, requiresApproval: true },
  { href: "/partner/juridico", labelKey: "partnerArea.nav.juridico", icon: Scale, requiresApproval: true },
  { href: "/partner/administrativo", labelKey: "partnerArea.nav.administrativo", icon: ClipboardList, requiresApproval: true },
  { href: "/partner/compras", labelKey: "partnerArea.nav.compras", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/fornecedores", labelKey: "partnerArea.nav.fornecedores", icon: Truck, requiresApproval: true },
  { href: "/partner/parcerias", labelKey: "partnerArea.nav.parcerias", icon: Handshake, requiresApproval: true },
  { href: "/partner/permissoes", labelKey: "partnerArea.nav.permissoes", icon: Shield, requiresApproval: true },
  { href: "/partner/infraestrutura", labelKey: "partnerArea.nav.infraestrutura", icon: Building, requiresApproval: true },
  { href: "/partner/ti", labelKey: "partnerArea.nav.ti", icon: Server, requiresApproval: true },
  { href: "/partner/equipamentos", labelKey: "partnerArea.nav.equipamentos", icon: Wrench, requiresApproval: true },
  { href: "/partner/iot", labelKey: "partnerArea.nav.iot", icon: Cpu, requiresApproval: true },
  { href: "/partner/automacoes", labelKey: "partnerArea.nav.automacoes", icon: Workflow, requiresApproval: true },
  { href: "/partner/ia", labelKey: "partnerArea.nav.iaErp", icon: Sparkles, requiresApproval: true },
  { href: "/partner/marketing", labelKey: "partnerArea.nav.marketing", icon: Megaphone, requiresApproval: true },
  { href: "/partner/social", labelKey: "partnerArea.nav.social", icon: UsersRound, requiresApproval: false },
  { href: "/partner/clientes", labelKey: "partnerArea.nav.clientesErp", icon: Heart, requiresApproval: true },
  { href: "/partner/fidelidade", labelKey: "partnerArea.nav.fidelidade", icon: Gift, requiresApproval: true },
  { href: "/partner/veterinario", labelKey: "partnerArea.nav.veterinario", icon: Stethoscope, requiresApproval: true },
  { href: "/partner/loja", labelKey: "partnerArea.nav.loja", icon: ShoppingCart, requiresApproval: true },
  { href: "/partner/integracoes", labelKey: "partnerArea.nav.integracoes", icon: Plug, requiresApproval: true },
  { href: "/partner/laboratorio", labelKey: "partnerArea.nav.laboratorio", icon: FlaskConical, requiresApproval: true },
  { href: "/partner/marketplace", labelKey: "partnerArea.nav.marketplace", icon: Store, requiresApproval: true },
  { href: "/partner/products", labelKey: "partnerArea.nav.products", icon: Package, requiresApproval: true },
  { href: "/partner/services", labelKey: "partnerArea.nav.services", icon: Scissors, requiresApproval: true },
  { href: "/partner/orders", labelKey: "partnerArea.nav.orders", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/appointments", labelKey: "partnerArea.nav.appointments", icon: CalendarDays, requiresApproval: true },
  { href: "/partner/customers", labelKey: "partnerArea.nav.customers", icon: Users, requiresApproval: true },
  { href: "/partner/messages", labelKey: "partnerArea.nav.messages", icon: MessageSquare, requiresApproval: false },
  { href: "/partner/notifications", labelKey: "partnerArea.nav.notifications", icon: Bell, requiresApproval: false },
  { href: "/partner/eccopet", labelKey: "partnerArea.nav.ai", icon: Sparkles, requiresApproval: true },
  { href: "/partner/profile", labelKey: "partnerArea.nav.profile", icon: Building2, requiresApproval: false },
  { href: "/partner/settings", labelKey: "partnerArea.nav.settings", icon: Settings, requiresApproval: false },
];

/** Bottom navigation mobile (5 atalhos). */
export const PARTNER_EXPERIENCE_BOTTOM_NAV: PartnerExperienceNavItem[] = [
  { href: "/partner", labelKey: "partnerArea.nav.overview", icon: LayoutDashboard, requiresApproval: false },
  { href: "/partner/products", labelKey: "partnerArea.nav.products", icon: Package, requiresApproval: true },
  { href: "/partner/orders", labelKey: "partnerArea.nav.orders", icon: ShoppingBag, requiresApproval: true },
  { href: "/partner/appointments", labelKey: "partnerArea.nav.appointments", icon: CalendarDays, requiresApproval: true },
  { href: "/partner/eccopet", labelKey: "partnerArea.nav.ai", icon: Sparkles, requiresApproval: true },
];

/** Prefixos /partner/* que exigem parceiro aprovado. */
export const PARTNER_APPROVAL_REQUIRED_PREFIXES = PARTNER_EXPERIENCE_NAV.filter(
  (i) => i.requiresApproval
).map((i) => i.href);

/** Rotas imersivas (largura plena, sem painel direito). */
export const PARTNER_IMMERSIVE_ROUTES = ["/partner/eccopet", "/partner/messages"];

/** Rotas que exibem painel direito de contexto. */
export const PARTNER_RIGHT_PANEL_ROUTES = ["/partner", "/partner/social"];

export function isPartnerExperienceNavActive(pathname: string, href: string): boolean {
  if (href === "/partner") return pathname === "/partner";
  if (href === "/partner/dashboard") return pathname === "/partner/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isPartnerExperiencePath(pathname: string): boolean {
  return pathname === "/partner" || pathname.startsWith("/partner/");
}

/** Rota /partner/* exige aprovação? */
export function partnerExperienceRouteRequiresApproval(pathname: string): boolean {
  return PARTNER_APPROVAL_REQUIRED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
