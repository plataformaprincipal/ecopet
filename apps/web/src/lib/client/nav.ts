import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutDashboard,
  Compass,
  ShoppingBag,
  PawPrint,
  HeartPulse,
  ListChecks,
  CalendarClock,
  FileText,
  Settings,
  User,
  Sparkles,
  Bot,
  Cpu,
  Zap,
  HomeIcon,
  DollarSign,
  BarChart3,
  Heart,
  Target,
  FileBarChart,
  Trophy,
} from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  {
    href: "/cliente",
    label: "Início",
    description: "Seu dashboard",
    icon: Home,
  },
  {
    href: "/cliente/pet-os",
    label: "Pet OS",
    description: "Central inteligente do pet",
    icon: LayoutDashboard,
  },
  {
    href: "/cliente/pets",
    label: "Pets",
    description: "Gestão dos pets",
    icon: PawPrint,
  },
  {
    href: "/cliente/saude",
    label: "Saúde",
    description: "Vacinas, exames e consultas",
    icon: HeartPulse,
  },
  {
    href: "/cliente/rotina",
    label: "Rotina",
    description: "Cuidados diários",
    icon: ListChecks,
  },
  {
    href: "/cliente/agenda",
    label: "Agenda",
    description: "Seus agendamentos",
    icon: CalendarClock,
  },
  {
    href: "/cliente/documentos",
    label: "Documentos",
    description: "Carteira, exames e laudos",
    icon: FileText,
  },
  {
    href: "/cliente/assistente",
    label: "Assistente",
    description: "IA do seu pet",
    icon: Bot,
  },
  {
    href: "/cliente/ia",
    label: "IA",
    description: "Memória e contexto",
    icon: Sparkles,
  },
  {
    href: "/cliente/iot",
    label: "IoT",
    description: "Dispositivos conectados",
    icon: Cpu,
  },
  {
    href: "/cliente/automacoes",
    label: "Automações",
    description: "Lembretes e regras",
    icon: Zap,
  },
  {
    href: "/cliente/casa-inteligente",
    label: "Casa inteligente",
    description: "Alexa, Google, Apple",
    icon: HomeIcon,
  },
  {
    href: "/cliente/financeiro",
    label: "Financeiro",
    description: "Gastos e orçamento",
    icon: DollarSign,
  },
  {
    href: "/cliente/analytics",
    label: "Analytics",
    description: "Indicadores e gráficos",
    icon: BarChart3,
  },
  {
    href: "/cliente/bem-estar",
    label: "Bem-estar",
    description: "Índice holístico",
    icon: Heart,
  },
  {
    href: "/cliente/metas",
    label: "Metas",
    description: "Objetivos e hábitos",
    icon: Target,
  },
  {
    href: "/cliente/relatorios",
    label: "Relatórios",
    description: "PDF e CSV",
    icon: FileBarChart,
  },
  {
    href: "/cliente/gamificacao",
    label: "Gamificação",
    description: "Missões e badges",
    icon: Trophy,
  },
  {
    href: "/cliente/marketplace",
    label: "Marketplace",
    description: "Compras e favoritos",
    icon: ShoppingBag,
  },
  {
    href: "/cliente/explorar",
    label: "Explorar",
    description: "Ecossistema pet",
    icon: Compass,
  },
  {
    href: "/cliente/perfil",
    label: "Perfil",
    description: "Conta e preferências",
    icon: User,
  },
  {
    href: "/cliente/configuracoes",
    label: "Configurações",
    description: "Idioma, notificações e privacidade",
    icon: Settings,
  },
];

export function isClientNavActive(pathname: string, href: string): boolean {
  if (href === "/cliente") return pathname === "/cliente";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isClientAreaPath(pathname: string): boolean {
  return (
    pathname === "/cliente" ||
    pathname.startsWith("/cliente/") ||
    pathname === "/client" ||
    pathname.startsWith("/client/")
  );
}
