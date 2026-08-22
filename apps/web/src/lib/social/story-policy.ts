/** Story ativo só existe enquanto expiresAt > now — nunca no cliente. */
export function isStoryPubliclyActive(expiresAt: Date | null | undefined, now = new Date()) {
  return Boolean(expiresAt && expiresAt.getTime() > now.getTime());
}
