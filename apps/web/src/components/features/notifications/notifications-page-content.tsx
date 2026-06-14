"use client";

import { useEffect, useMemo } from "react";
import { Search, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layouts/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotificationsStore } from "@/store/notifications-store";
import { AiSummaryBlock } from "@/components/features/notifications/ai-summary-block";
import { NotificationFilters } from "@/components/features/notifications/notification-filters";
import { NotificationCard } from "@/components/features/notifications/notification-card";
import { NotificationsEmpty } from "@/components/features/notifications/notifications-empty";
import { NotificationsSkeleton } from "@/components/features/notifications/notifications-skeleton";
import type { NotificationFilter } from "@/lib/notifications/types";
import { useAppStore } from "@/store/app-store";

export function NotificationsPageContent() {
  const token = useAppStore((s) => s.apiToken);
  const loading = useNotificationsStore((s) => s.loading);
  const loaded = useNotificationsStore((s) => s.loaded);
  const filter = useNotificationsStore((s) => s.filter);
  const searchQuery = useNotificationsStore((s) => s.searchQuery);
  const aiSummary = useNotificationsStore((s) => s.aiSummary);
  const notifications = useNotificationsStore((s) => s.notifications);
  const load = useNotificationsStore((s) => s.load);
  const setFilter = useNotificationsStore((s) => s.setFilter);
  const setSearchQuery = useNotificationsStore((s) => s.setSearchQuery);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const filteredNotifications = useNotificationsStore((s) => s.filteredNotifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  useEffect(() => {
    if (!loaded && !loading) load(token ?? undefined);
  }, [loaded, loading, load, token]);

  const list = filteredNotifications();
  const unread = unreadCount();

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<NotificationFilter, number>> = { all: notifications.length };
    for (const n of notifications) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  return (
    <>
      <AppHeader title="Notificações" />
      <main className="mx-auto max-w-2xl flex-1 p-4 pb-8 lg:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" aria-hidden />
            <Input
              placeholder="Buscar notificações..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar notificações"
            />
          </div>
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {!loading && unread > 0 && (
          <p className="mb-3 text-xs font-medium text-ecopet-green">
            {unread} não {unread === 1 ? "lida" : "lidas"}
          </p>
        )}

        <div className="mb-4">
          <NotificationFilters active={filter} onChange={setFilter} counts={filterCounts} />
        </div>

        {loading ? (
          <NotificationsSkeleton />
        ) : (
          <div className="space-y-4">
            {aiSummary && filter === "all" && !searchQuery && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <AiSummaryBlock summary={aiSummary} />
              </motion.div>
            )}

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
                  <NotificationCard notification={notification} onMarkRead={markAsRead} />
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
