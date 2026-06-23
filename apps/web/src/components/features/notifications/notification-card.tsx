"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/notifications/types";
import {
  formatNotificationDateTime,
  formatNotificationTime,
  getCategoryConfig,
  getPriorityStyles,
  TYPE_LABEL_KEYS,
} from "@/lib/notifications/config";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead, onDelete }: NotificationCardProps) {
  const { t, locale } = useTranslation();
  const config = getCategoryConfig(notification.category);
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-md",
        !notification.read && "border-l-4 border-l-ecopet-green bg-ecopet-green/[0.03] dark:bg-ecopet-green/[0.06]"
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", config.bg, config.border)}>
            <Icon className={cn("h-5 w-5", config.color)} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className={cn("text-[10px]", config.bg, config.color)}>{t(config.labelKey)}</Badge>
              <Badge variant="outline" className={cn("text-[10px]", getPriorityStyles(notification.priority))}>
                {t(`notifications.priority.${notification.priority}`)}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">{t(TYPE_LABEL_KEYS[notification.type])}</Badge>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-ecopet-green" aria-label={t("notifications.unread")} />
              )}
              <span className="ml-auto text-[11px] text-ecopet-gray" title={formatNotificationDateTime(notification.createdAt, locale)}>
                {formatNotificationTime(notification.createdAt, locale)}
              </span>
            </div>

            <h3 className={cn("text-sm leading-snug", notification.read ? "font-medium" : "font-bold")}>{notification.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-ecopet-gray dark:text-white/60">{notification.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!notification.read && (
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onMarkRead(notification.id)}>
                  {t("notifications.markRead")}
                </Button>
              )}
              {notification.actionUrl && (
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
                  <Link href={notification.actionUrl} onClick={() => !notification.read && onMarkRead(notification.id)}>
                    {t("notifications.actions.viewDetails")}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 text-xs text-red-600"
                  onClick={() => onDelete(notification.id)}
                  aria-label={t("notifications.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
