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
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-ecopet-gray/12 bg-white/95 backdrop-blur-xl transition-transform dark:border-white/10 dark:bg-ecopet-dark/95 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-ecopet-gray/12 p-4 dark:border-white/10">
          <div>
            <Link href="/admin" className="font-display text-lg font-bold text-ecopet-green" onClick={onClose}>
              EcoPet Admin
            </Link>
            <p className="text-xs text-ecopet-gray dark:text-white/60">Painel empresarial</p>
          </div>
          <button type="button" className="rounded-[var(--radius-sm)] p-1 text-ecopet-gray hover:bg-ecopet-green/10 hover:text-ecopet-green lg:hidden" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação administrativa">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ecopet-gray/80 dark:text-white/45">
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
                      "mb-0.5 flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green",
                      active
                        ? "bg-ecopet-green/10 font-medium text-ecopet-green shadow-[var(--shadow-xs)]"
                        : "text-ecopet-gray hover:bg-ecopet-green/[0.06] hover:text-ecopet-dark dark:text-white/65 dark:hover:bg-white/5 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-ecopet-gray/12 p-3 dark:border-white/10">
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-ecopet-gray transition hover:bg-ecopet-green/[0.06] hover:text-ecopet-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green dark:text-white/65 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
            Meu perfil
          </Link>
        </div>
      </aside>
    </>
  );
}
