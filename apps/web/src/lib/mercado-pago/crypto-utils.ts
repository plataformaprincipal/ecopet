import { createHash, randomUUID } from "crypto";

export function newIdempotencyKey(): string {
  return randomUUID();
}

export function hashPayload(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
