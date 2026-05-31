import type { Notification, AiSummary } from "./types";
import { MOCK_NOTIFICATIONS, MOCK_AI_SUMMARY } from "./mock-data";

const LOAD_DELAY_MS = 700;

/**
 * Futura integração com API ECOPET.
 * Substituir implementação mock por:
 *   return api<Notification[]>('/api/notifications', { token });
 */
export async function fetchNotifications(_token?: string): Promise<Notification[]> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS));
  return MOCK_NOTIFICATIONS.map((n) => ({ ...n }));
}

/**
 * Futura integração com IA ECOPET.
 * Substituir por:
 *   return api<AiSummary>('/api/notifications/ai-summary', { token });
 */
export async function fetchAiSummary(_token?: string): Promise<AiSummary> {
  await new Promise((r) => setTimeout(r, LOAD_DELAY_MS / 2));
  return { ...MOCK_AI_SUMMARY, insights: [...MOCK_AI_SUMMARY.insights] };
}

/**
 * Futuro: PATCH /api/notifications/:id/read
 */
export async function markNotificationReadApi(_id: string, _token?: string): Promise<void> {
  /* noop — mock local */
}

/**
 * Futuro: POST /api/notifications/read-all
 */
export async function markAllNotificationsReadApi(_token?: string): Promise<void> {
  /* noop — mock local */
}
