"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/store/notifications-store";
import { useEffect } from "react";

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  label?: string;
  variant?: "nav" | "header" | "sidebar";
}

export function NotificationBell({
  className,
  iconClassName,
  showLabel = false,
  label = "Notificações",
  variant = "header",
}: NotificationBellProps) {
  const pathname = usePathname();
  const active = pathname.startsWith("/notificacoes");
  const unread = useNotificationsStore((s) => s.unreadCount());
  const loaded = useNotificationsStore((s) => s.loaded);
  const load = useNotificationsStore((s) => s.load);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const badge = unread > 0 && (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ecopet-yellow px-1 text-[10px] font-bold text-ecopet-dark ring-2 ring-white dark:ring-[#0f1419]">
      {unread > 99 ? "99+" : unread}
    </span>
  );

  const baseStyles = cn(
    "relative inline-flex items-center gap-2 transition-colors",
    variant === "header" && "rounded-xl p-2 hover:bg-ecopet-green/10",
    variant === "sidebar" &&
      cn(
        "rounded-xl px-4 py-3 text-sm w-full",
        active
          ? "bg-ecopet-green/10 text-ecopet-green font-medium"
          : "text-ecopet-gray hover:bg-ecopet-green/5"
      ),
    variant === "nav" &&
      cn(
        "flex-col gap-0.5 px-2 py-1 text-[10px] font-medium",
        active ? "text-ecopet-green" : "text-ecopet-gray"
      ),
    className
  );

  return (
    <Link href="/notificacoes" className={baseStyles} aria-label={`${label}${unread ? `, ${unread} não lidas` : ""}`}>
      <span className="relative">
        <Bell className={cn("h-5 w-5", active && variant === "nav" && "scale-110", iconClassName)} aria-hidden />
        {badge}
      </span>
      {showLabel && <span>{label}</span>}
    </Link>
  );
}
