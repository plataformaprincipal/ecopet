"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications/api";
import type { ChannelStatus, NotificationPreferences } from "@/lib/notifications/types";

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
        aria-label={label}
      />
      <div className="h-6 w-11 rounded-full bg-ecopet-gray/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-ecopet-green peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
    </label>
  );
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ecopet-gray/10 py-3 last:border-0 dark:border-white/10">
      <div>
        <p className="text-sm font-medium text-ecopet-dark dark:text-white">{label}</p>
        {hint && <p className="text-xs text-ecopet-gray">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function NotificationPreferencesPanel() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [channels, setChannels] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchNotificationPreferences()
      .then(({ preferences, channels: ch }) => {
        setPrefs(preferences);
        setChannels(ch);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("notifications.preferences.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  async function save(next: Partial<NotificationPreferences>) {
    if (!prefs) return;
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const result = await updateNotificationPreferences(next);
      setPrefs(result.preferences);
      setChannels(result.channels);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("notifications.preferences.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function subscribePush() {
    setPushBusy(true);
    setPushMessage(null);
    setError(null);
    try {
      // Preferência: Firebase Cloud Messaging (quando configurado)
      const { isFirebaseClientReady } = await import("@/lib/firebase/config");
      if (isFirebaseClientReady()) {
        const { requestFcmToken } = await import("@/lib/firebase/messaging-client");
        const result = await requestFcmToken();
        if (result.token) {
          const res = await fetch("/api/notifications/push/register", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: result.token,
              deviceId: result.deviceId,
              permissionStatus: "GRANTED",
            }),
          });
          const body = (await res.json()) as {
            success?: boolean;
            error?: { message?: string };
          };
          if (!res.ok || !body.success) {
            setError(body.error?.message ?? t("notifications.preferences.pushSubscribeError"));
            return;
          }
          if (!prefs?.pushEnabled) {
            await save({ pushEnabled: true });
          }
          setPushMessage(t("notifications.preferences.pushSubscribeSuccess"));
          return;
        }
        if (result.state === "DENIED") {
          setError(t("push.deniedHint"));
          return;
        }
        // continua para Web Push legado se FCM falhar
      }

      const keyRes = await fetch("/api/push/vapid-public-key");
      const keyJson = (await keyRes.json()) as { configured?: boolean; publicKey?: string };
      if (!keyJson.configured || !keyJson.publicKey) {
        setPushMessage(t("notifications.preferences.pushNotConfigured"));
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError(t("notifications.preferences.pushSubscribeError"));
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(t("notifications.preferences.pushSubscribeError"));
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: { message?: string };
      };
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? t("notifications.preferences.pushSubscribeError"));
        return;
      }

      if (!prefs?.pushEnabled) {
        await save({ pushEnabled: true });
      }
      setPushMessage(t("notifications.preferences.pushSubscribeSuccess"));
    } catch {
      setError(t("notifications.preferences.pushSubscribeError"));
    } finally {
      setPushBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="card-premium">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-ecopet-green" aria-hidden />
        </CardContent>
      </Card>
    );
  }

  if (!prefs) {
    return (
      <Card className="card-premium">
        <CardContent className="p-6 text-sm text-red-600">{error ?? t("notifications.preferences.loadError")}</CardContent>
      </Card>
    );
  }

  const channelHint = (configured: boolean) =>
    configured ? undefined : t("notifications.preferences.channelNotConfigured");

  const pushConfigured = Boolean(channels?.push);

  return (
    <Card className="card-premium">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-3">{t("notifications.preferences.title")}</h2>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-ecopet-green" aria-hidden />}
        </div>

        <p className="mb-4 text-sm text-ecopet-gray">{t("notifications.preferences.subtitle")}</p>

        <h3 className="mb-2 text-sm font-semibold">{t("notifications.preferences.channels")}</h3>
        <SettingRow
          label={t("notifications.preferences.inApp")}
          checked={prefs.inAppEnabled}
          onChange={(v) => void save({ inAppEnabled: v })}
        />
        <SettingRow
          label={t("notifications.preferences.email")}
          hint={channelHint(channels?.email ?? false)}
          checked={prefs.emailEnabled}
          disabled={!channels?.email}
          onChange={(v) => void save({ emailEnabled: v })}
        />
        <SettingRow
          label={t("notifications.preferences.sms")}
          hint={channelHint(channels?.sms ?? false)}
          checked={prefs.smsEnabled}
          disabled={!channels?.sms}
          onChange={(v) => void save({ smsEnabled: v })}
        />
        <SettingRow
          label={t("notifications.preferences.whatsapp")}
          hint={channelHint(channels?.whatsapp ?? false)}
          checked={prefs.whatsappEnabled}
          disabled={!channels?.whatsapp}
          onChange={(v) => void save({ whatsappEnabled: v })}
        />
        <div className="border-b border-ecopet-gray/10 py-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ecopet-dark dark:text-white">
                {t("notifications.preferences.push")}
              </p>
              {!pushConfigured ? (
                <p className="text-xs text-ecopet-gray">
                  {t("notifications.preferences.pushNotConfigured")}
                </p>
              ) : null}
            </div>
            <Toggle
              checked={prefs.pushEnabled}
              onChange={(v) => void save({ pushEnabled: v })}
              disabled={!pushConfigured}
              label={t("notifications.preferences.push")}
            />
          </div>
          {pushConfigured ? (
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pushBusy}
                onClick={() => void subscribePush()}
              >
                {pushBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {t("notifications.preferences.pushSubscribe")}
              </Button>
            </div>
          ) : null}
          {pushMessage ? (
            <p className="mt-2 text-xs text-ecopet-green" role="status">
              {pushMessage}
            </p>
          ) : null}
        </div>
        <SettingRow
          label={t("notifications.preferences.marketing")}
          checked={prefs.marketingEnabled}
          onChange={(v) => void save({ marketingEnabled: v })}
        />

        <h3 className="mb-2 mt-6 text-sm font-semibold">{t("notifications.preferences.topics")}</h3>
        <SettingRow label={t("notifications.preferences.orders")} checked={prefs.orderUpdates} onChange={(v) => void save({ orderUpdates: v })} />
        <SettingRow label={t("notifications.preferences.appointments")} checked={prefs.appointmentUpdates} onChange={(v) => void save({ appointmentUpdates: v })} />
        <SettingRow label={t("notifications.preferences.social")} checked={prefs.socialUpdates} onChange={(v) => void save({ socialUpdates: v })} />
        <SettingRow label={t("notifications.preferences.adoptions")} checked={prefs.adoptionUpdates} onChange={(v) => void save({ adoptionUpdates: v })} />
        <SettingRow label={t("notifications.preferences.campaigns")} checked={prefs.campaignUpdates} onChange={(v) => void save({ campaignUpdates: v })} />
        <SettingRow label={t("notifications.preferences.products")} checked={prefs.productUpdates} onChange={(v) => void save({ productUpdates: v })} />
        <SettingRow label={t("notifications.preferences.services")} checked={prefs.serviceUpdates} onChange={(v) => void save({ serviceUpdates: v })} />
        <SettingRow
          label={t("notifications.preferences.security")}
          hint={t("notifications.preferences.securityHint")}
          checked={prefs.securityUpdates}
          disabled
          onChange={() => {}}
        />

        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
        {saved && !saving && (
          <p className="mt-4 text-sm text-ecopet-green" role="status">{t("notifications.preferences.saved")}</p>
        )}
      </CardContent>
    </Card>
  );
}
