"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ShoppingBag,
  ClipboardList,
  Calendar,
  Share2,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/approvals", label: "Aprovações", icon: UserCheck },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/admin/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/appointments", label: "Agendamentos", icon: Calendar },
  { href: "/admin/social", label: "Social e denúncias", icon: Share2 },
  { href: "/admin/audit", label: "Auditoria", icon: Shield },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-white dark:bg-gray-950">
      <div className="border-b p-4">
        <Link href="/admin" className="font-display text-lg font-bold text-ecopet-green">
          EcoPet Admin
        </Link>
        <p className="text-xs text-muted-foreground">Painel administrativo</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação administrativa">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
                active
                  ? "bg-ecopet-green/10 font-medium text-ecopet-green"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Link
          href="/perfil"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Meu perfil
        </Link>
      </div>
    </aside>
  );
}
