"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Calendar,
  MessageSquare,
  Headphones,
  Plug,
  Wallet,
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  Share2,
  Flag,
  Package,
  Wrench,
  Heart,
} from "lucide-react";

const NAV = [
  { href: "/dashboard/admin/gestor/overview", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/admin/gestor/users", label: "Usuários", icon: Users },
  { href: "/dashboard/admin/gestor/partners", label: "Parceiros", icon: Store },
  { href: "/dashboard/admin/gestor/ongs", label: "ONGs", icon: Heart },
  { href: "/dashboard/admin/gestor/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/dashboard/admin/gestor/products", label: "Produtos", icon: Package },
  { href: "/dashboard/admin/gestor/services", label: "Serviços", icon: Wrench },
  { href: "/dashboard/admin/gestor/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/admin/gestor/appointments", label: "Agendamentos", icon: Calendar },
  { href: "/dashboard/admin/gestor/social", label: "Social", icon: Share2 },
  { href: "/dashboard/admin/gestor/moderation", label: "Moderação", icon: Flag },
  { href: "/dashboard/admin/gestor/support", label: "Suporte", icon: Headphones },
  { href: "/dashboard/admin/gestor/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/admin/gestor/integrations", label: "Integrações", icon: Plug },
  { href: "/dashboard/admin/gestor/finance", label: "Financeiro", icon: Wallet },
  { href: "/dashboard/admin/gestor/audit", label: "Auditoria", icon: Shield },
  { href: "/dashboard/admin/gestor/reports", label: "Relatórios", icon: FileText },
  { href: "/dashboard/admin/gestor/quality", label: "Qualidade", icon: AlertTriangle },
  { href: "/dashboard/admin/gestor/system-health", label: "Saúde do sistema", icon: Activity },
];

export function GestorSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r bg-white dark:bg-gray-950">
      <div className="border-b p-4">
        <Link href="/dashboard/admin/gestor" className="font-display text-lg font-bold text-ecopet-green">
          Gestor EcoPet
        </Link>
        <p className="text-xs text-muted-foreground">BI e relatórios operacionais</p>
      </div>
      <nav className="max-h-[calc(100vh-8rem)] overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-ecopet-green/10 font-medium text-ecopet-green" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
