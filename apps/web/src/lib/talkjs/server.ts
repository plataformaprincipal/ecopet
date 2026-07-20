import { createHmac } from "crypto";
import type { ConversationContextType, UserRole } from "@prisma/client";
import type { TalkJsUserPayload } from "@/lib/talkjs/types";
import {
  getTalkJsPrivateConfig,
  getTalkJsPublicConfig,
  isTalkJsServerConfigured as isConfigured,
  toTalkJsUserId,
} from "@/lib/talkjs/config";

export {
  getTalkJsHealthSnapshot,
  isMessagingFlagEnabled,
  listMessagingFeatureFlags,
  isTalkJsPublicConfigured,
  toTalkJsUserId,
} from "@/lib/talkjs/config";

export function getTalkJsAppId(): string | null {
  return getTalkJsPublicConfig().appId;
}

export function getTalkJsSecretKey(): string | null {
  return getTalkJsPrivateConfig().secretKey;
}

export function isTalkJsServerConfigured(): boolean {
  return isConfigured();
}

export function buildTalkJsConversationId(params: {
  contextType: ConversationContextType;
  contextId: string;
  userAId: string;
  userBId: string;
}): string {
  const [a, b] = [params.userAId, params.userBId].sort();
  const ctx = params.contextId || "none";
  return `ecopet_${params.contextType}_${ctx}_${a}_${b}`;
}

export function generateTalkJsSignature(userId: string): string | null {
  const secret = getTalkJsSecretKey();
  if (!secret) return null;
  const talkJsId = toTalkJsUserId(userId);
  return createHmac("sha256", secret).update(talkJsId).digest("hex");
}

async function talkJsRequest(path: string, body: Record<string, unknown>) {
  const appId = getTalkJsAppId();
  const secret = getTalkJsSecretKey();
  const { apiV1Base } = getTalkJsPrivateConfig();
  if (!appId || !secret) return;

  const res = await fetch(`${apiV1Base}/${appId}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[TalkJS] sync failed ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
}

export async function syncTalkJsUser(user: TalkJsUserPayload) {
  const id = toTalkJsUserId(user.id);
  await talkJsRequest(`/users/${encodeURIComponent(id)}`, {
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl ?? undefined,
    role: user.role,
    custom: { ecopetRole: user.role },
  });
}

export async function syncTalkJsConversation(params: {
  conversationId: string;
  participantIds: string[];
  subject?: string;
  contextType: ConversationContextType;
  contextId: string | null;
  ecopetConversationId: string;
}) {
  const participants = params.participantIds.map((id) => [toTalkJsUserId(id)]);
  await talkJsRequest(`/conversations/${encodeURIComponent(params.conversationId)}`, {
    participants,
    subject: params.subject,
    custom: {
      contextType: params.contextType,
      contextId: params.contextId ?? "",
      ecopetConversationId: params.ecopetConversationId,
    },
  });
}

export function assertPersonaCanMessage(initiatorRole: UserRole, targetRole: UserRole): boolean {
  if (initiatorRole === "ADMIN") return true;
  if (initiatorRole === "CLIENT" && (targetRole === "PARTNER" || targetRole === "ONG")) return true;
  if (initiatorRole === "TUTOR" && (targetRole === "PARTNER" || targetRole === "ONG")) return true;
  if (initiatorRole === "PARTNER" && (targetRole === "CLIENT" || targetRole === "TUTOR")) return true;
  if (initiatorRole === "ONG" && (targetRole === "CLIENT" || targetRole === "TUTOR")) return true;
  return false;
}
