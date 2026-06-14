"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/brand/logo";
import { isNavActive } from "@/lib/navigation/role-nav";
import {
  getNavigationMode,
  resolveNavigation,
  safeLogoHref,
} from "@/lib/navigation/secure-nav";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { useTranslation } from "@/providers/i18n-provider";

export function MainNavigation() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role, loading } = useFoundationSession();

  const mode = getNavigationMode(loading, role);
  const { main, secondary } = resolveNavigation(mode, role);
  const logoHref = safeLogoHref(mode, role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ecopet-dark/20 bg-ecopet-dark dark:border-white/10 lg:flex">
      <div className="p-6">
        <Logo href={logoHref} responsive />
      </div>

      {mode === "loading" ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-white/50">{t("common.loading")}</p>
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                    active
                      ? "bg-ecopet-green text-white shadow-md shadow-ecopet-green/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>

          {secondary.length > 0 && (
            <div className="border-t border-ecopet-gray/10 p-3 dark:border-white/10">
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
                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-ecopet-green/20 text-ecopet-yellow"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
