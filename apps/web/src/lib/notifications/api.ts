import type { Notification, AiSummary } from "./types";
import { api } from "@/lib/api";

const LOAD_DELAY_MS = 400;

type ApiNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string | null;
};

function mapNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    description: n.body,
    category: (n.type?.toLowerCase() as Notification["category"]) || "system",
    read: n.read,
    createdAt: n.createdAt,
    action: n.link ? { label: "Ver detalhes", href: n.link } : undefined,
  };
}

export async function fetchNotifications(token?: string): Promise<{ items: Notification[]; isDemo: boolean }> {
  if (token) {
    try {
      const rows = await api<ApiNotification[]>("/api/notifications", { token });
      return { items: rows.map(mapNotification), isDemo: false };
    } catch {
      /* fallback empty for new users */
      return { items: [], isDemo: false };
    }
  }
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  return { items: [], isDemo: false };
}

export async function fetchAiSummary(_token?: string): Promise<AiSummary | null> {
  return null;
}

export async function markNotificationReadApi(id: string, token?: string): Promise<void> {
  if (!token) return;
  await api(`/api/notifications/${id}/read`, { method: "PATCH", token, body: "{}" }).catch(() => {});
}

export async function markAllNotificationsReadApi(_token?: string): Promise<void> {
  /* reservado */
}
