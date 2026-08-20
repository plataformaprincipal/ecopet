import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { resolveAuthSecret } from "@/lib/auth-secret";

const ALGO = "aes-256-gcm";
const VERSION = "v1";

function deriveKey(): Buffer {
  const secret = resolveAuthSecret();
  return createHash("sha256").update(`${secret}:ecopet-mp-oauth:${VERSION}`).digest();
}

export function encryptMpSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptMpSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("INVALID_MP_SECRET_PAYLOAD");
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(ALGO, deriveKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
