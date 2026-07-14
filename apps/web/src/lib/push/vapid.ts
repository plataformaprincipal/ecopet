/**
 * VAPID key helpers for Web Push.
 * Never log private keys or full public keys in production logs.
 */

export type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function readPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    ""
  );
}

function readPrivateKey(): string {
  return process.env.VAPID_PRIVATE_KEY?.trim() || "";
}

function readSubject(): string {
  return (
    process.env.VAPID_SUBJECT?.trim() ||
    process.env.VAPID_CONTACT?.trim() ||
    "mailto:noreply@ecopet.app"
  );
}

/** True only when both public and private VAPID keys are present. */
export function isPushConfigured(): boolean {
  return Boolean(readPublicKey() && readPrivateKey());
}

/** Public key for client subscription, or null if not configured. */
export function getVapidPublicKey(): string | null {
  const key = readPublicKey();
  return key || null;
}

/** Full VAPID config for sending, or null if not configured. */
export function getVapidConfig(): VapidConfig | null {
  const publicKey = readPublicKey();
  const privateKey = readPrivateKey();
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    subject: readSubject(),
  };
}
