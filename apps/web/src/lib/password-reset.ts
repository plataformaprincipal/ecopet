import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function resetExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + RESET_TOKEN_TTL_MS);
}

export function appUrl(): string {
  return (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function resetPasswordLink(token: string): string {
  return `${appUrl()}/redefinir-senha?token=${encodeURIComponent(token)}`;
}
