"use client";

import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useTranslation } from "@/providers/i18n-provider";

function statusLabel(
  t: (k: string) => string,
  permission: string,
  state: string,
  serverActive: boolean
): string {
  if (permission === "UNSUPPORTED") return t("push.status.unsupported");
  if (permission === "DENIED") return t("push.status.denied");
  if (state === "TOKEN_REGISTERED" || serverActive) return t("push.status.registered");
  if (state === "TOKEN_FAILED" || state === "ERROR") return t("push.status.error");
  if (permission === "GRANTED") return t("push.status.granted");
  if (state === "REQUESTING") return t("push.status.requesting");
  return t("push.status.default");
}

export function NotificationStatus() {
  const { t } = useTranslation();
  const push = usePushNotifications();
  const label = statusLabel(t, push.permission, push.state, push.serverActive);

  return (
    <dl className="grid gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{t("push.statusLabel")}</dt>
        <dd className="font-medium text-ecopet-dark dark:text-white" aria-live="polite">
          {label}
        </dd>
      </div>
      {push.deviceId ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("push.device")}</dt>
          <dd className="truncate font-mono text-xs" title={push.deviceId}>
            {push.deviceId.slice(0, 8)}…
          </dd>
        </div>
      ) : null}
      {push.lastSyncedAt ? (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("push.lastSync")}</dt>
          <dd className="text-xs">
            {new Date(push.lastSyncedAt).toLocaleString()}
          </dd>
        </div>
      ) : null}
      {push.error ? (
        <p className="text-xs text-red-600" role="alert">
          {t("push.errorGeneric")}
        </p>
      ) : null}
    </dl>
  );
}
