"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SOCIAL_NAV } from "@/lib/social/config";

export function SocialSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-16 z-30 -mx-4 border-b border-ecopet-gray/10 bg-white/90 px-4 backdrop-blur-md dark:border-white/10 dark:bg-[#0f1419]/90 lg:-mx-6 lg:px-6"
      aria-label="Navegação social"
    >
      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SOCIAL_NAV.map(({ href, label }) => {
          const active =
            href === "/feed"
              ? pathname === "/feed"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                active
                  ? "bg-ecopet-green text-white shadow-sm"
                  : "text-ecopet-gray hover:bg-ecopet-green/10 dark:text-white/70"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
