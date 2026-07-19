"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PushPermissionButton } from "@/components/notifications/push-permission-button";
import { NotificationStatus } from "@/components/notifications/notification-status";
import { useTranslation } from "@/providers/i18n-provider";

export function PushPermissionCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("push.cardTitle")}</CardTitle>
        <CardDescription>{t("push.cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NotificationStatus />
        <PushPermissionButton />
      </CardContent>
    </Card>
  );
}
