import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { getTalkJsHealthSnapshot } from "@/lib/talkjs/config";
import { prisma } from "@/lib/prisma";
import { generateTalkJsSignature, isTalkJsServerConfigured } from "@/lib/talkjs/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, error } = await requireAdmin({
    path: new URL(request.url).pathname,
  });
  if (error || !user) return error!;

  const health = getTalkJsHealthSnapshot();
  let signatureOk = false;
  if (isTalkJsServerConfigured()) {
    signatureOk = Boolean(generateTalkJsSignature(user.id));
  }

  const [convCount, webhookStats] = await Promise.all([
    prisma.conversation.count({ where: { talkjsConversationId: { not: null } } }),
    prisma.webhookEvent.groupBy({
      by: ["status"],
      where: { provider: "talkjs" },
      _count: true,
    }),
  ]);

  return apiSuccess({
    health: {
      ...health,
      signatureGenerationOk: signatureOk,
      talkjsLinkedConversations: convCount,
      webhooksByStatus: Object.fromEntries(
        webhookStats.map((w) => [w.status, w._count])
      ),
    },
  });
}
