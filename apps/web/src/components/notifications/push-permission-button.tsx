"use client";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useTranslation } from "@/providers/i18n-provider";

export function PushPermissionButton({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const push = usePushNotifications();

  if (!push.configured) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {t("push.notConfigured")}
      </p>
    );
  }

  if (push.permission === "UNSUPPORTED") {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {t("push.unsupported")}
      </p>
    );
  }

  if (push.permission === "DENIED") {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
        {t("push.deniedHint")}
      </p>
    );
  }

  if (push.state === "TOKEN_REGISTERED" || push.serverActive) {
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled={push.busy}
        onClick={() => void push.disable()}
        aria-label={t("push.disable")}
      >
        {push.busy ? t("push.working") : t("push.disable")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={className}
      disabled={push.busy || push.permission === "REQUESTING"}
      onClick={() => void push.enable()}
      aria-label={t("push.enable")}
    >
      {push.busy ? t("push.working") : t("push.enable")}
    </Button>
  );
}
