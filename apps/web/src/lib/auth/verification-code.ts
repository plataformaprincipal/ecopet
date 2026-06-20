import crypto from "crypto";

export const VERIFICATION_PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

export function verificationCodeTtlMs(): number {
  const testMs = process.env.AUTH_TEST_OTP_TTL_MS;
  if (testMs && /^\d+$/.test(testMs)) return parseInt(testMs, 10);
  return 15 * 60 * 1000;
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function verificationExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + verificationCodeTtlMs());
}
