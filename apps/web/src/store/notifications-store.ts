import { create } from "zustand";
import type { Notification, NotificationFilter } from "@/lib/notifications/types";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from "@/lib/notifications/api";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  loading: boolean;
  loaded: boolean;
  filter: NotificationFilter;
  searchQuery: string;
  resetForUser: () => void;
  load: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  setFilter: (filter: NotificationFilter) => void;
  setSearchQuery: (query: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  filteredNotifications: () => Notification[];
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  loading: false,
  loaded: false,
  filter: "all",
  searchQuery: "",

  resetForUser: () =>
    set({ notifications: [], unreadCount: 0, nextCursor: null, loaded: false }),

  refreshUnreadCount: async () => {
    try {
      const count = await fetchUnreadCount();
      set({ unreadCount: count });
    } catch {
      set({ unreadCount: 0 });
    }
  },

  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [{ items, nextCursor }, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      set({ notifications: items, nextCursor, unreadCount: count, loaded: true });
    } catch {
      set({ notifications: [], nextCursor: null, unreadCount: 0, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const cursor = get().nextCursor;
    if (!cursor || get().loading) return;
    set({ loading: true });
    try {
      const { items, nextCursor } = await fetchNotifications({ cursor });
      set((state) => ({
        notifications: [...state.notifications, ...items],
        nextCursor,
      }));
    } finally {
      set({ loading: false });
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  markAsRead: async (id) => {
    await markNotificationReadApi(id);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await markAllNotificationsReadApi();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  remove: async (id) => {
    await deleteNotificationApi(id);
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: removed && !removed.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  filteredNotifications: () => {
    const { notifications, filter, searchQuery } = get();
    const q = searchQuery.trim().toLowerCase();

    return notifications
      .filter((n) => {
        if (filter === "all") return true;
        if (filter === n.category) return true;
        return filter === n.type;
      })
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
