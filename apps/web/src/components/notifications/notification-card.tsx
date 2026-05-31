"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/notifications/types";
import {
  formatNotificationDateTime,
  formatNotificationTime,
  getCategoryConfig,
} from "@/lib/notifications/config";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const config = getCategoryConfig(notification.category);
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md",
        !notification.read &&
          "border-l-4 border-l-ecopet-green bg-ecopet-green/[0.03] dark:bg-ecopet-green/[0.06]"
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-5 w-5", config.color)} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className={cn("text-[10px]", config.bg, config.color)}>
                {config.label}
              </Badge>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-ecopet-green" aria-label="Não lida" />
              )}
              <span className="ml-auto text-[11px] text-ecopet-gray" title={formatNotificationDateTime(notification.createdAt)}>
                {formatNotificationTime(notification.createdAt)}
              </span>
            </div>

            <h3
              className={cn(
                "text-sm leading-snug",
                notification.read
                  ? "font-medium text-ecopet-dark/90 dark:text-white/90"
                  : "font-bold text-ecopet-dark dark:text-white"
              )}
            >
              {notification.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-ecopet-gray dark:text-white/60">
              {notification.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!notification.read && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-ecopet-gray"
                  onClick={() => onMarkRead(notification.id)}
                >
                  Marcar como lida
                </Button>
              )}
              {notification.action && (
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link
                    href={notification.action.href}
                    onClick={() => !notification.read && onMarkRead(notification.id)}
                  >
                    {notification.action.label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
