"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, LayoutDashboard, MapPin, Radio, Cpu, Bot, Plane, Sparkles,
  BarChart3, TrendingUp, Sprout, Wheat, Layers, CloudSun, Beef,
  Tractor, Package, AlertTriangle, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AGRO_NAV } from "@/lib/agro/config";

const icons: Record<string, React.ElementType> = {
  Home, LayoutDashboard, MapPin, Radio, Cpu, Bot, Plane, Sparkles,
  BarChart3, TrendingUp, Sprout, Wheat, Layers, CloudSun, Beef,
  Tractor, Package, AlertTriangle, ShoppingCart,
};

export function FarmSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-ecopet-gray/10 bg-white dark:border-white/10 dark:bg-[#0f1419] xl:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ecopet-green">Agro Inteligente</p>
        <nav className="space-y-0.5">
          {AGRO_NAV.map(({ href, label, icon }) => {
            const Icon = icons[icon] ?? Home;
            const active = href === "/agro" ? pathname === "/agro" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  active ? "bg-ecopet-green text-white" : "text-ecopet-gray hover:bg-ecopet-green/10 dark:text-white/70"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
