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
import { logRecoveryAudit } from "@/lib/auth/recovery-audit";
import {
  isRecoveryBlocked,
  onRecoveryVerifyFailure,
  RECOVERY_BLOCKED_MESSAGE,
} from "@/lib/auth/recovery-security";

const VERIFY_IP_LIMIT = 20;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`verify-reset:ip:${ip}`, VERIFY_IP_LIMIT, VERIFY_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", RECOVERY_BLOCKED_MESSAGE, 429);
    }

    const body = await request.json();
    const parsed = verifyResetCodeSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier, code } = parsed.data;

    if (isRecoveryBlocked(identifier)) {
      await logRecoveryAudit({ event: "blocked", ip, metadata: { step: "verify" } });
      return apiFailure("RATE_LIMIT", RECOVERY_BLOCKED_MESSAGE, 429);
    }

    const user = await findUserByRecoveryIdentifier(prisma, identifier);
    if (!user) {
      await logRecoveryAudit({ event: "verify_failed", ip, metadata: { reason: "user_not_found" } });
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
      onRecoveryVerifyFailure(identifier);
      await logRecoveryAudit({
        userId: user.id,
        event: "verify_failed",
        ip,
        metadata: { reason: hasExpired ? "expired" : "invalid" },
      });
      if (hasExpired && records.length > 0) {
        return apiFailure("CODE_EXPIRED", VERIFY_CODE_EXPIRED_MESSAGE, 400);
      }
      return apiFailure("CODE_INVALID", VERIFY_CODE_INVALID_MESSAGE, 400);
    }

    if (matching.expiresAt <= now) {
      onRecoveryVerifyFailure(identifier);
      await logRecoveryAudit({
        userId: user.id,
        event: "verify_failed",
        ip,
        metadata: { reason: "expired" },
      });
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

    await logRecoveryAudit({
      userId: user.id,
      event: "verify_success",
      ip,
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
