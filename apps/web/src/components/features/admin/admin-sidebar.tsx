"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, X } from "lucide-react";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "@/lib/admin/nav-config";

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ open = true, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Fechar menu"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r bg-white transition-transform dark:bg-gray-950 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <Link href="/admin" className="font-display text-lg font-bold text-ecopet-green" onClick={onClose}>
              EcoPet Admin
            </Link>
            <p className="text-xs text-muted-foreground">Painel empresarial</p>
          </div>
          <button type="button" className="rounded p-1 lg:hidden" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação administrativa">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              {ADMIN_NAV.filter((n) => n.group === group).map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
                      active
                        ? "bg-ecopet-green/10 font-medium text-ecopet-green"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Meu perfil
          </Link>
        </div>
      </aside>
    </>
  );
}
