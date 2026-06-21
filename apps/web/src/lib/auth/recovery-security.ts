import { checkAuthRateLimit } from "@/lib/rate-limit";

const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_LIMIT = 3;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;
const VERIFY_LIMIT = 5;
const BLOCK_MS = 30 * 60 * 1000;

type BlockEntry = { blockedUntil: number };
const blocks = new Map<string, BlockEntry>();

function blockKey(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function isRecoveryBlocked(identifier: string): boolean {
  const key = blockKey(identifier);
  const entry = blocks.get(key);
  if (!entry) return false;
  if (Date.now() >= entry.blockedUntil) {
    blocks.delete(key);
    return false;
  }
  return true;
}

export function blockRecovery(identifier: string): void {
  blocks.set(blockKey(identifier), { blockedUntil: Date.now() + BLOCK_MS });
}

export function checkRecoveryRequestLimit(identifier: string): boolean {
  return checkAuthRateLimit(`recovery:req:${blockKey(identifier)}`, REQUEST_LIMIT, REQUEST_WINDOW_MS);
}

export function checkRecoveryVerifyLimit(identifier: string): boolean {
  return checkAuthRateLimit(`recovery:verify:${blockKey(identifier)}`, VERIFY_LIMIT, VERIFY_WINDOW_MS);
}

export function onRecoveryVerifyFailure(identifier: string): boolean {
  const key = `recovery:verify:${blockKey(identifier)}`;
  const allowed = checkAuthRateLimit(key, VERIFY_LIMIT, VERIFY_WINDOW_MS);
  if (!allowed) {
    blockRecovery(identifier);
  }
  return allowed;
}

export const RECOVERY_BLOCKED_MESSAGE =
  "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";

export const RECOVERY_RATE_LIMIT_MESSAGE =
  "Limite de solicitações atingido. Tente novamente em uma hora.";
