import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { prisma } from "@/lib/prisma";
import {
  generateTalkJsSignature,
  getTalkJsAppId,
  getTalkJsSecretKey,
  syncTalkJsUser,
} from "@/lib/talkjs/server";

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const appId = getTalkJsAppId();
    if (!appId) {
      return apiFailure("TALKJS_NOT_CONFIGURED", "TalkJS não configurado.", 503);
    }

    const chatUser = await requireActiveChatUser(user!.id);
    const dbUser = await prisma.user.findUnique({
      where: { id: chatUser.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    if (!dbUser) return apiFailure("NOT_FOUND", "Usuário não encontrado.", 404);

    const signature = generateTalkJsSignature(dbUser.id);
    const identityVerificationEnabled = Boolean(getTalkJsSecretKey());

    if (identityVerificationEnabled) {
      await syncTalkJsUser({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        photoUrl: dbUser.avatarUrl,
        role: dbUser.role,
      });
    }

    return apiSuccess({
      appId,
      userId: dbUser.id,
      signature,
      identityVerificationEnabled,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        photoUrl: dbUser.avatarUrl,
        role: dbUser.role,
      },
    });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
