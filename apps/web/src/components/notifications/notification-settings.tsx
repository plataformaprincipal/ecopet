"use client";

import { PushPermissionCard } from "@/components/notifications/push-permission-card";
import { NotificationPreferencesPanel } from "@/components/features/notifications/notification-preferences-panel";

/**
 * Configurações de notificação: preferências existentes + FCM neste dispositivo.
 */
export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <PushPermissionCard />
      <NotificationPreferencesPanel />
    </div>
  );
}
