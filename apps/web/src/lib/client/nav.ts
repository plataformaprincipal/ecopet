import type { LucideIcon } from "lucide-react";
import {
  Home,
  PawPrint,
  CalendarClock,
  Package,
  Coins,
  Users,
  MessageSquare,
  Headphones,
  User,
} from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { href: "/cliente", label: "Início", description: "O que está acontecendo agora", icon: Home },
  { href: "/cliente/meu-pet", label: "Meu Pet", description: "Perfil, caderneta e documentos", icon: PawPrint },
  { href: "/cliente/agenda", label: "Agenda", description: "Serviços e agendamentos", icon: CalendarClock },
  { href: "/cliente/pedidos", label: "Pedidos", description: "Compras e status", icon: Package },
  { href: "/cliente/rewards", label: "Rewards", description: "Saldo EccoPontos", icon: Coins },
  { href: "/cliente/explorar", label: "Social", description: "Comunidade e exploração", icon: Users },
  { href: "/dashboard/messages", label: "Mensagens", description: "Conversas", icon: MessageSquare },
  { href: "/cliente/suporte", label: "Suporte", description: "Tickets e ajuda", icon: Headphones },
  { href: "/cliente/perfil", label: "Conta", description: "Dados e privacidade", icon: User },
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
