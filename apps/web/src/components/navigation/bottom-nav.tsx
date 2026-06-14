"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/navigation/role-nav";
import { getNavigationMode, resolveNavigation } from "@/lib/navigation/secure-nav";
import { useFoundationSession } from "@/hooks/use-foundation-session";
import { useTranslation } from "@/providers/i18n-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role, loading } = useFoundationSession();

  const mode = getNavigationMode(loading, role);
  const { main } = resolveNavigation(mode, role);

  if (mode === "loading" || main.length === 0) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-ecopet-gray/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1419]/95 lg:hidden"
      aria-label={t("landing.mainNav")}
    >
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1">
        {main.slice(0, 5).map(({ href, labelKey, icon: Icon, ...item }) => {
          const active = isNavActive(pathname, { href, labelKey, icon: Icon, ...item });
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 transition-all duration-200",
                active ? "text-ecopet-green" : "text-ecopet-gray dark:text-white/50"
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-ecopet-green transition-all" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
              <span className={cn("text-[10px] font-semibold leading-tight", active && "text-ecopet-green")}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
