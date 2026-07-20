import "server-only";

import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectGtmEnvironment } from "@/lib/gtm/config";
import { isTransactionalEventName } from "./types";
import { gtmServerLog } from "./logger";

function hashRef(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function buildDeduplicationKey(
  eventName: string,
  entityType: string,
  entityId: string
): string {
  return hashRef(`${eventName}|${entityType}|${entityId}`);
}

/**
 * Claim atômico — primeira chamada retorna claimed=true.
 * Tentativas seguintes incrementam attempts e retornam claimed=false.
 */
export async function claimTransactionalEvent(input: {
  eventName: string;
  entityType: string;
  entityId: string;
  ttlDays?: number;
}): Promise<{ claimed: boolean; attempts: number; key: string }> {
  if (!isTransactionalEventName(input.eventName)) {
    throw new Error("EVENT_NOT_TRANSACTIONAL");
  }
  const entityId = String(input.entityId).slice(0, 128);
  if (!entityId) throw new Error("ENTITY_REQUIRED");

  const key = buildDeduplicationKey(input.eventName, input.entityType, entityId);
  const entityReferenceHash = hashRef(entityId);
  const env = detectGtmEnvironment();
  const expiresAt =
    input.ttlDays && input.ttlDays > 0
      ? new Date(Date.now() + input.ttlDays * 86_400_000)
      : new Date(Date.now() + 365 * 86_400_000);

  try {
    const created = await prisma.analyticsTransactionalDedup.create({
      data: {
        eventName: input.eventName,
        deduplicationKey: key,
        entityType: input.entityType.slice(0, 40),
        entityReferenceHash,
        status: "CLAIMED",
        environment: env,
        expiresAt,
        attempts: 1,
      },
    });
    gtmServerLog("INFO", "transactional claim", {
      eventName: input.eventName,
      entityType: input.entityType,
    });
    return { claimed: true, attempts: created.attempts, key };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const updated = await prisma.analyticsTransactionalDedup.update({
        where: { deduplicationKey: key },
        data: { attempts: { increment: 1 }, lastAttemptAt: new Date() },
      });
      gtmServerLog("INFO", "transactional duplicate blocked", {
        eventName: input.eventName,
        attempts: updated.attempts,
      });
      return { claimed: false, attempts: updated.attempts, key };
    }
    throw e;
  }
}

export async function getDedupStats() {
  const [total, blockedAttempts] = await Promise.all([
    prisma.analyticsTransactionalDedup.count(),
    prisma.analyticsTransactionalDedup.aggregate({
      _sum: { attempts: true },
    }),
  ]);
  const attemptsSum = blockedAttempts._sum.attempts ?? 0;
  return {
    claims: total,
    /** Tentativas extras além do primeiro claim. */
    duplicatesBlocked: Math.max(0, attemptsSum - total),
    available: true,
  };
}
