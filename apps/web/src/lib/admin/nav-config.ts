import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Scale,
  Users,
  Cpu,
  Lightbulb,
  Megaphone,
  FolderKanban,
  Lock,
  FlaskConical,
  TrendingUp,
  Wrench,
  Plug,
  UserCheck,
  Building2,
  Heart,
  ShoppingBag,
  Share2,
  Settings,
  Shield,
  ClipboardList,
  Calendar,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard Executivo", icon: LayoutDashboard, exact: true, group: "Executivo" },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign, group: "Financeiro" },
  { href: "/admin/contabil", label: "Contábil", icon: FileText, group: "Financeiro" },
  { href: "/admin/juridico", label: "Jurídico", icon: Scale, group: "Compliance" },
  { href: "/admin/rh", label: "Recursos Humanos", icon: Users, group: "Pessoas" },
  { href: "/admin/ti", label: "TI / Segurança", icon: Cpu, group: "Tecnologia" },
  { href: "/admin/inovacao", label: "Inovação e IA", icon: Lightbulb, group: "Inovação" },
  { href: "/admin/marketing", label: "Design e Marketing", icon: Megaphone, group: "Growth" },
  { href: "/admin/administrativo", label: "Administrativo", icon: FolderKanban, group: "Operações" },
  { href: "/admin/permissoes", label: "Acessos e Permissões", icon: Lock, group: "Governança" },
  { href: "/admin/laboratorio", label: "Laboratório do Sistema", icon: FlaskConical, group: "Sistema" },
  { href: "/admin/comercial", label: "Comercial / Vendas", icon: TrendingUp, group: "Comercial" },
  { href: "/admin/tecnico", label: "Técnico / Operações", icon: Wrench, group: "Operações" },
  { href: "/admin/integracoes", label: "Integrações", icon: Plug, group: "Ecossistema" },
  { href: "/admin/users", label: "Usuários", icon: Users, group: "Plataforma" },
  { href: "/admin/partners", label: "Parceiros", icon: Building2, group: "Plataforma" },
  { href: "/admin/ngos", label: "ONGs", icon: Heart, group: "Plataforma" },
  { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag, group: "Plataforma" },
  { href: "/admin/social", label: "Social / Comunidade", icon: Share2, group: "Plataforma" },
  { href: "/admin/approvals", label: "Aprovações", icon: UserCheck, group: "Plataforma" },
  { href: "/admin/orders", label: "Pedidos", icon: ClipboardList, group: "Plataforma" },
  { href: "/admin/appointments", label: "Agendamentos", icon: Calendar, group: "Plataforma" },
  { href: "/admin/settings", label: "Configurações", icon: Settings, group: "Sistema" },
  { href: "/admin/audit", label: "Auditoria / Logs", icon: Shield, group: "Governança" },
];

export const ADMIN_NAV_GROUPS = [...new Set(ADMIN_NAV.map((n) => n.group))];
