export function getTalkJsAppId(): string | null {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID?.trim();
  return appId || null;
}

export function isTalkJsConfigured(): boolean {
  return Boolean(getTalkJsAppId());
}

/** Apenas App ID público — nunca secrets. */
export function getTalkJsClientStatus() {
  const appId = getTalkJsAppId();
  return {
    configured: Boolean(appId),
    appIdPreview: appId ? `${appId.slice(0, 4)}…` : null,
  };
}
