import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { PlatformEventInput } from "./event-types";

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function logSystemEvent(input: PlatformEventInput) {
  const row = await prisma.systemEvent.create({
    data: {
      type: input.type,
      actorId: input.actorId,
      actorRole: input.actorRole,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: toJson(input.payload),
      metadata: toJson(input.metadata),
      severity: input.severity ?? "info",
    },
  });
  return row;
}

export async function logPlatformEventMirror(input: PlatformEventInput) {
  return prisma.platformEvent.create({
    data: {
      eventType: input.type,
      personaScope: "GLOBAL",
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: toJson(input.payload ?? {}),
      severity: input.severity ?? "info",
    },
  });
}
