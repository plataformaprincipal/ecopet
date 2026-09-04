"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import {
  CLIENT_EXPERIENCE_NAV,
  isClientExperienceNavActive,
} from "@/lib/client/experience-nav";

type Props = {
  userName: string;
  primaryPet?: { name: string; species?: string } | null;
};

export function ClientExperienceSidebar({ userName, primaryPet }: Props) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const firstName = userName.split(" ")[0];

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-xl lg:flex">
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("clientArea.area")}
        </p>
        <h2 className="mt-1 truncate font-display text-lg font-semibold text-sidebar-foreground">
          {t("clientArea.home.greeting", { name: firstName })}
        </h2>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ecopet-green/10">
            <PawPrint className="h-4 w-4 text-ecopet-green" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {primaryPet?.name ?? t("clientArea.home.petCard")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {primaryPet ? primaryPet.species ?? "" : t("clientArea.home.noPet")}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label={t("clientArea.area")}>
        {CLIENT_EXPERIENCE_NAV.map((item) => {
          const active = isClientExperienceNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
