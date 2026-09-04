/**
 * Marketplace CLIENT ↔ PARTNER usa chat nativo quando a flag está ativa.
 * TalkJS permanece no código como fallback (flag off / outros canais).
 */
export function isNativeMarketplaceChatEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  const raw = (
    env.NEXT_PUBLIC_NATIVE_MARKETPLACE_CHAT ??
    env.NATIVE_MARKETPLACE_CHAT ??
    "true"
  )
    .trim()
    .toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
