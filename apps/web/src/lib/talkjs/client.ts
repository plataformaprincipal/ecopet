export function getTalkJsAppId(): string | null {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID?.trim();
  return appId || null;
}

export function isTalkJsConfigured(): boolean {
  return Boolean(getTalkJsAppId());
}
