import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { verifyResetCodeSchema } from "@/schemas/password-reset";
import { findUserByRecoveryIdentifier } from "@/lib/auth/recovery-identifier";
import {
  hashVerificationCode,
  VERIFICATION_PURPOSE_PASSWORD_RESET,
} from "@/lib/auth/verification-code";
import {
  VERIFY_CODE_EXPIRED_MESSAGE,
  VERIFY_CODE_INVALID_MESSAGE,
} from "@/lib/constants/auth-messages";
import { generateResetToken, hashResetToken, resetExpiresAt } from "@/lib/password-reset";

const VERIFY_LIMIT = 10;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`verify-reset:ip:${ip}`, VERIFY_LIMIT, VERIFY_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const parsed = verifyResetCodeSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier, code } = parsed.data;

    if (!checkAuthRateLimit(`verify-reset:id:${identifier.toLowerCase()}`, VERIFY_LIMIT, VERIFY_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const user = await findUserByRecoveryIdentifier(prisma, identifier);
    if (!user) {
      return apiFailure("CODE_INVALID", VERIFY_CODE_INVALID_MESSAGE, 400);
    }

    const records = await prisma.verificationCode.findMany({
      where: {
        userId: user.id,
        purpose: VERIFICATION_PURPOSE_PASSWORD_RESET,
        used: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const codeHash = hashVerificationCode(code);
    const now = new Date();
    const matching = records.find((r) => r.code === codeHash);

    if (!matching) {
      const hasExpired = records.some((r) => r.expiresAt <= now);
      if (hasExpired && records.length > 0) {
        return apiFailure("CODE_EXPIRED", VERIFY_CODE_EXPIRED_MESSAGE, 400);
      }
      return apiFailure("CODE_INVALID", VERIFY_CODE_INVALID_MESSAGE, 400);
    }

    if (matching.expiresAt <= now) {
      return apiFailure("CODE_EXPIRED", VERIFY_CODE_EXPIRED_MESSAGE, 400);
    }

    await prisma.verificationCode.update({
      where: { id: matching.id },
      data: { used: true },
    });

    const plainToken = generateResetToken();
    const tokenHash = hashResetToken(plainToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: resetExpiresAt(now),
      },
    });

    return apiSuccess({
      message: "Código verificado com sucesso.",
      resetToken: plainToken,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[verify-reset-code:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível validar o código. Tente novamente.", 500);
  }
}
