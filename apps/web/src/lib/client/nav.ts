import type { LucideIcon } from "lucide-react";
import { Home, Compass, ShoppingBag, PawPrint, User } from "lucide-react";

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
    href: "/cliente/explorar",
    label: "Explorar",
    description: "Ecossistema pet",
    icon: Compass,
  },
  {
    href: "/cliente/marketplace",
    label: "Marketplace",
    description: "Compras e favoritos",
    icon: ShoppingBag,
  },
  {
    href: "/cliente/meu-pet",
    label: "Meu Pet",
    description: "Gestão dos pets",
    icon: PawPrint,
  },
  {
    href: "/cliente/perfil",
    label: "Perfil",
    description: "Conta e preferências",
    icon: User,
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
