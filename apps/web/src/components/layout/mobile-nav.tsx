"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, Film, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

const items = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/feed", icon: Rss, label: "Feed", match: ["/feed", "/social/stories", "/social/tendencias", "/social/salvos", "/social/explorar"] },
  { href: "/social/reels", icon: Film, label: "Reels", match: ["/social/reels"] },
  { href: "/pets", icon: PawPrint, label: "Pets", match: ["/pets"] },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-ecopet-gray/10 bg-white/95 backdrop-blur-lg dark:border-white/10 dark:bg-[#0f1419]/95 lg:hidden">
      <div className="flex items-end justify-around py-1.5">
        {items.slice(0, 2).map(({ href, icon: Icon, label, match }) => {
          const active = (match ?? [href]).some((m) => pathname.startsWith(m));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                active ? "text-ecopet-green" : "text-ecopet-gray"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
        <NotificationBell variant="nav" showLabel label="Alertas" className="px-2 pb-0.5" />
        {items.slice(2).map(({ href, icon: Icon, label, match }) => {
          const active = (match ?? [href]).some((m) => pathname.startsWith(m));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
                active ? "text-ecopet-green" : "text-ecopet-gray"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
