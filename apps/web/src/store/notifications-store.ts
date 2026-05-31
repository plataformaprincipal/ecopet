import { create } from "zustand";
import type { Notification, NotificationFilter, AiSummary } from "@/lib/notifications/types";
import { fetchNotifications, fetchAiSummary } from "@/lib/notifications/api";

interface NotificationsState {
  notifications: Notification[];
  aiSummary: AiSummary | null;
  loading: boolean;
  loaded: boolean;
  filter: NotificationFilter;
  searchQuery: string;
  load: (token?: string) => Promise<void>;
  setFilter: (filter: NotificationFilter) => void;
  setSearchQuery: (query: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: () => number;
  filteredNotifications: () => Notification[];
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  aiSummary: null,
  loading: false,
  loaded: false,
  filter: "all",
  searchQuery: "",

  load: async (token) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const [notifications, aiSummary] = await Promise.all([
        fetchNotifications(token),
        fetchAiSummary(token),
      ]);
      set({ notifications, aiSummary, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  filteredNotifications: () => {
    const { notifications, filter, searchQuery } = get();
    const q = searchQuery.trim().toLowerCase();

    return notifications
      .filter((n) => filter === "all" || n.category === filter)
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
}));
