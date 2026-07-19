"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAriaAnnounce } from "@/components/shared/accessibility/aria-live-region";
import {
  subscribeForegroundMessages,
  type MessagePayload,
} from "@/lib/firebase/messaging-client";
import { sanitizeNotificationUrl } from "@/lib/firebase/safe-url";
import { isFirebaseClientReady } from "@/lib/firebase/config";
import { useTranslation } from "@/providers/i18n-provider";

type Banner = {
  title: string;
  body: string;
  url: string;
  id: string;
};

/**
 * Escuta FCM em primeiro plano — toast acessível + anúncio aria-live.
 * Não dispara Notification do browser (evita duplicata).
 */
export function ForegroundNotificationListener() {
  const announce = useAriaAnnounce();
  const { t } = useTranslation();
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    if (!isFirebaseClientReady()) return;

    const unsub = subscribeForegroundMessages((payload: MessagePayload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        t("push.foregroundTitle");
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        "";
      const url = sanitizeNotificationUrl(payload.data?.url || "/notifications");
      const id =
        payload.data?.notificationId ||
        payload.data?.tag ||
        `fg-${Date.now()}`;

      setBanner({ title, body, url, id });
      announce(`${title}. ${body}`, "polite");

      // Atualiza badge/contagem da central interna
      try {
        window.dispatchEvent(new CustomEvent("ecopet:notifications-refresh"));
      } catch {
        /* ignore */
      }
    });

    return unsub;
  }, [announce, t]);

  if (!banner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-lg border border-ecopet-green/30 bg-white p-4 shadow-lg dark:bg-ecopet-dark"
    >
      <p className="text-sm font-semibold text-ecopet-dark dark:text-white">{banner.title}</p>
      {banner.body ? (
        <p className="mt-1 text-sm text-ecopet-gray dark:text-white/80">{banner.body}</p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Link
          href={banner.url}
          className="text-sm font-medium text-ecopet-green underline-offset-2 hover:underline"
          onClick={() => setBanner(null)}
        >
          {t("push.open")}
        </Link>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setBanner(null)}
        >
          {t("push.dismiss")}
        </button>
      </div>
    </div>
  );
}
