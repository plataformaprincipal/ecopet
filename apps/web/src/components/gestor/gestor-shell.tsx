"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GESTOR_MODULES } from "@/lib/gestor/config";
import { fetchMyPermissions } from "@/lib/gestor/api";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { useTranslation } from "@/providers/i18n-provider";
import type { AppRole } from "@/lib/permissions";

export function GestorSidebar() {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetchMyPermissions()
      .then((r) => setPermissions(r.permissions))
      .catch(() => setPermissions([]));
  }, []);

  const visibleModules = GESTOR_MODULES.filter((m) => {
    if (!permissions) return true;
    if (permissions.length === 0) return m.id === "dashboard";
    return permissions.includes(m.permission);
  });

  const groups = [...new Set(visibleModules.map((m) => m.group))];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ecopet-gray/10 bg-white dark:bg-ecopet-dark-card lg:block">
      <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <div className="mb-6 flex items-center gap-2">
          <EcoPetLogo variant="icon" size={32} />
          <div>
            <p className="font-display text-sm font-extrabold text-ecopet-dark dark:text-white">Gestor ECOPET</p>
            <p className="text-[10px] text-ecopet-gray">Sistema Interno da Empresa</p>
          </div>
        </div>
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-ecopet-gray">{group}</p>
            <nav className="space-y-0.5">
              {visibleModules.filter((m) => m.group === group).map((mod) => {
                const href = mod.href;
                const active = pathname === href || (mod.id !== "dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={mod.id}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-ecopet-green text-white" : "text-ecopet-gray hover:bg-ecopet-green/10 hover:text-ecopet-green"
                    )}
                  >
                    <mod.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{mod.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function GestorGuard({ children, role }: { children: React.ReactNode; role?: AppRole | string }) {
  const { t } = useTranslation();
  const allowed = role === "ADMIN";

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <p className="font-display text-xl font-bold">{t("gestor.accessDenied.title")}</p>
        <p className="mt-2 text-ecopet-gray">{t("gestor.accessDenied.description")}</p>
        <Link href="/dashboard" className="mt-4 text-ecopet-green underline">
          {t("gestor.accessDenied.back")}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function GestorPasswordGate({
  mustChangePassword,
  children,
}: {
  mustChangePassword?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (mustChangePassword && !pathname.includes("/gestor/alterar-senha")) {
    if (typeof window !== "undefined") {
      window.location.href = "/gestor/alterar-senha";
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-ecopet-gray">Redirecionando para troca de senha...</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function GestorPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-extrabold text-ecopet-dark dark:text-white">{title}</h1>
      {description && <p className="mt-1 text-sm text-ecopet-gray">{description}</p>}
    </div>
  );
}

export function GestorLoading() {
  return <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-ecopet-gray/10" />)}</div>;
}

export function GestorError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
