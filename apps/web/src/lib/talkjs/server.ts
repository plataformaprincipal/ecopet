import { createHmac } from "crypto";
import type { ConversationContextType, UserRole } from "@prisma/client";
import type { TalkJsUserPayload } from "@/lib/talkjs/types";

const TALKJS_API = "https://api.talkjs.com/v1";

export function getTalkJsAppId(): string | null {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID?.trim();
  return appId || null;
}

export function getTalkJsSecretKey(): string | null {
  const secret = process.env.TALKJS_SECRET_KEY?.trim();
  return secret || null;
}

export function isTalkJsServerConfigured(): boolean {
  return Boolean(getTalkJsAppId() && getTalkJsSecretKey());
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
  // Identity Verification: ative em TalkJS Dashboard → Settings → Security
  // e use a mesma secret key em TALKJS_SECRET_KEY.
  // O frontend recebe esta assinatura via GET /api/messages/talkjs/session.
  return createHmac("sha256", secret).update(userId).digest("hex");
}

async function talkJsRequest(path: string, body: Record<string, unknown>) {
  const appId = getTalkJsAppId();
  const secret = getTalkJsSecretKey();
  if (!appId || !secret) return;

  const res = await fetch(`${TALKJS_API}/${appId}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`[TalkJS] sync failed ${path}: ${res.status} ${text}`);
  }
}

export async function syncTalkJsUser(user: TalkJsUserPayload) {
  await talkJsRequest(`/users/${encodeURIComponent(user.id)}`, {
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
  const participants = params.participantIds.map((id) => [id]);
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
  if (initiatorRole === "PARTNER" && targetRole === "CLIENT") return true;
  if (initiatorRole === "ONG" && targetRole === "CLIENT") return true;
  return false;
}
