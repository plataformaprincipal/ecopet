"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { isNavActive } from "@/lib/navigation/role-nav";
import {
  getNavigationMode,
  resolveNavigation,
  safeLogoHref,
} from "@/lib/navigation/secure-nav";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { useTranslation } from "@/providers/i18n-provider";
import { LogoutButton } from "@/components/shared/auth/logout-button";

export function MainNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role, loading } = useFoundationSession();

  const mode = getNavigationMode(loading, role);
  const { main, secondary } = resolveNavigation(mode, role);
  const logoHref = safeLogoHref(mode, role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-ecopet-dark lg:flex">
      <div className="p-5">
        <EcoPetLogo href={logoHref} variant="dark" showText size="md" priority />
      </div>

      {mode === "loading" ? (
        <div className="flex flex-1 items-center justify-center px-6" role="status" aria-label={t("common.loading")}>
          <div className="h-10 w-10 animate-ecopet-pulse rounded-2xl bg-white/10" aria-hidden />
        </div>
      ) : (
        <>
          <nav className="flex-1 space-y-1 px-3" aria-label={t("landing.mainNav")}>
            {main.map(({ href, labelKey, icon: Icon, ...item }) => {
              const active = isNavActive(pathname, { href, labelKey, icon: Icon, ...item });
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-colors duration-[var(--duration-fast)]",
                    active
                      ? "bg-ecopet-green text-white shadow-[var(--shadow-sm)]"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>

          {secondary.length > 0 && (
            <div className="border-t border-white/10 p-3">
              <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {t("common.more")}
              </p>
              <div className="space-y-0.5">
                {secondary.map(({ href, labelKey, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-ecopet-green/25 text-white"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                      {t(labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {mode === "authenticated" && (
            <div className="border-t border-ecopet-gray/10 p-3 dark:border-white/10">
              <LogoutButton variant="sidebar" />
            </div>
          )}
        </>
      )}
    </aside>
  );
}
