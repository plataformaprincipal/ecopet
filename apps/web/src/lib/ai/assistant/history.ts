import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ConversationMeta } from "./history-types";

export type { ConversationMeta } from "./history-types";

function asMeta(raw: unknown): ConversationMeta {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    pinned: o.pinned === true,
    favorite: o.favorite === true,
    archived: o.archived === true,
  };
}

export async function listAssistantConversations(userId: string, q?: string) {
  const rows = await prisma.aIConversation.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(q?.trim()
        ? { title: { contains: q.trim().slice(0, 80), mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      module: true,
      locale: true,
      status: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const mapped = rows.map((r) => {
    const meta = asMeta(r.metadata);
    return {
      id: r.id,
      title: r.title,
      module: r.module,
      locale: r.locale,
      status: r.status,
      pinned: Boolean(meta.pinned),
      favorite: Boolean(meta.favorite),
      archived: Boolean(meta.archived),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  return mapped
    .filter((c) => !c.archived)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +b.updatedAt - +a.updatedAt);
}

export async function patchAssistantConversation(
  userId: string,
  id: string,
  patch: {
    title?: string;
    pinned?: boolean;
    favorite?: boolean;
    archived?: boolean;
  }
) {
  const existing = await prisma.aIConversation.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true, metadata: true, title: true },
  });
  if (!existing) return null;

  const meta = asMeta(existing.metadata);
  const nextMeta: ConversationMeta = {
    ...meta,
    ...(typeof patch.pinned === "boolean" ? { pinned: patch.pinned } : {}),
    ...(typeof patch.favorite === "boolean" ? { favorite: patch.favorite } : {}),
    ...(typeof patch.archived === "boolean" ? { archived: patch.archived } : {}),
  };

  return prisma.aIConversation.update({
    where: { id },
    data: {
      ...(typeof patch.title === "string"
        ? { title: patch.title.trim().slice(0, 120) || existing.title }
        : {}),
      metadata: nextMeta as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      title: true,
      metadata: true,
      updatedAt: true,
    },
  });
}
