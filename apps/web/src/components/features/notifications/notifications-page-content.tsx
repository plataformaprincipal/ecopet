"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layouts/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotificationsStore } from "@/store/notifications-store";
import { NotificationFilters } from "@/components/features/notifications/notification-filters";
import { NotificationCard } from "@/components/features/notifications/notification-card";
import { NotificationsEmpty } from "@/components/features/notifications/notifications-empty";
import { NotificationsSkeleton } from "@/components/features/notifications/notifications-skeleton";
import type { NotificationFilter } from "@/lib/notifications/types";
import { useTranslation } from "@/providers/i18n-provider";

export function NotificationsPageContent() {
  const { t } = useTranslation();
  const loading = useNotificationsStore((s) => s.loading);
  const loaded = useNotificationsStore((s) => s.loaded);
  const filter = useNotificationsStore((s) => s.filter);
  const searchQuery = useNotificationsStore((s) => s.searchQuery);
  const notifications = useNotificationsStore((s) => s.notifications);
  const nextCursor = useNotificationsStore((s) => s.nextCursor);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const load = useNotificationsStore((s) => s.load);
  const loadMore = useNotificationsStore((s) => s.loadMore);
  const setFilter = useNotificationsStore((s) => s.setFilter);
  const setSearchQuery = useNotificationsStore((s) => s.setSearchQuery);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const remove = useNotificationsStore((s) => s.remove);
  const filteredNotifications = useNotificationsStore((s) => s.filteredNotifications);

  useEffect(() => {
    if (!loaded && !loading) load();
  }, [loaded, loading, load]);

  const list = filteredNotifications();

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<NotificationFilter, number>> = { all: notifications.length };
    for (const n of notifications) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  return (
    <>
      <AppHeader titleKey="notifications.title" />
      <main className="mx-auto max-w-2xl flex-1 p-4 pb-8 lg:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" aria-hidden />
            <Input
              placeholder={t("notifications.searchPlaceholder")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("notifications.searchPlaceholder")}
            />
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4" aria-hidden />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        {unreadCount > 0 && (
          <p className="mb-3 text-xs font-medium text-ecopet-green" aria-live="polite">
            {t("notifications.unreadCount", { count: String(unreadCount) })}
          </p>
        )}

        <div className="mb-4">
          <NotificationFilters active={filter} onChange={setFilter} counts={filterCounts} />
        </div>

        {loading && notifications.length === 0 ? (
          <NotificationsSkeleton />
        ) : (
          <div className="space-y-4">
            {list.length === 0 ? (
              <NotificationsEmpty hasSearch={Boolean(searchQuery.trim()) || filter !== "all"} />
            ) : (
              list.map((notification, i) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <NotificationCard
                    notification={notification}
                    onMarkRead={(id) => void markAsRead(id)}
                    onDelete={(id) => void remove(id)}
                  />
                </motion.div>
              ))
            )}

            {nextCursor && (
              <Button variant="outline" className="w-full" onClick={() => loadMore()} disabled={loading}>
                <RefreshCw className={cnIcon(loading)} aria-hidden />
                {t("notifications.loadMore")}
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function cnIcon(loading: boolean) {
  return `mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`;
}
