import { prisma } from "@/lib/prisma";
import { logMailError } from "@/lib/mail";
import { emailPasswordReset } from "@/lib/mail/event-dispatch";
import { generateResetToken, hashResetToken, resetExpiresAt, resetPasswordLink } from "@/lib/password-reset";
import { checkAuthRateLimit, checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  FORGOT_PASSWORD_NOT_FOUND_MESSAGE,
  FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE,
} from "@/lib/constants/auth-messages";
import { forgotPasswordSchema } from "@/schemas/password-reset";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import {
  findUserByRecoveryIdentifier,
  isPhoneSmsRecoveryEnabled,
  parseRecoveryIdentifier,
} from "@/lib/auth/recovery-identifier";
import {
  generateVerificationCode,
  hashVerificationCode,
  verificationExpiresAt,
  VERIFICATION_PURPOSE_PASSWORD_RESET,
} from "@/lib/auth/verification-code";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_IP = 10;
const RATE_LIMIT_IDENTIFIER = 5;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`forgot:ip:${ip}`, RATE_LIMIT_IP, RATE_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier } = parsed.data;
    const recovery = parseRecoveryIdentifier(identifier);

    if (!checkRateLimit(`forgot:id:${identifier.toLowerCase()}`, RATE_LIMIT_IDENTIFIER, RATE_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    if (recovery.type === "phone" && !isPhoneSmsRecoveryEnabled()) {
      return apiFailure("PHONE_RECOVERY_UNAVAILABLE", FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE, 503);
    }

    const user = await findUserByRecoveryIdentifier(prisma, identifier);

    if (!user) {
      return apiFailure("NOT_FOUND", FORGOT_PASSWORD_NOT_FOUND_MESSAGE, 404);
    }

    const now = new Date();

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    await prisma.verificationCode.updateMany({
      where: {
        userId: user.id,
        purpose: VERIFICATION_PURPOSE_PASSWORD_RESET,
        used: false,
      },
      data: { used: true },
    });

    if (recovery.type === "email") {
      const plainToken = generateResetToken();
      const tokenHash = hashResetToken(plainToken);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: resetExpiresAt(now),
        },
      });

      try {
        const resetUrl = resetPasswordLink(plainToken);
        await emailPasswordReset(user.email, resetUrl, user.name);
      } catch (mailError) {
        logMailError("forgot-password", mailError);
        if (process.env.NODE_ENV !== "production") {
          console.info("[forgot-password:dev] E-mail não enviado — SMTP não configurado ou indisponível.");
        }
      }

      return apiSuccess({ message: FORGOT_PASSWORD_GENERIC_MESSAGE, channel: "email" });
    }

    const otp = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: hashVerificationCode(otp),
        purpose: VERIFICATION_PURPOSE_PASSWORD_RESET,
        expiresAt: verificationExpiresAt(now),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.info(`[forgot-password:dev] OTP SMS simulado para ***${user.phone?.slice(-4)}: ${otp}`);
    }

    return apiSuccess({
      message: FORGOT_PASSWORD_GENERIC_MESSAGE,
      channel: "phone",
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[forgot-password:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível processar sua solicitação. Tente novamente.", 500);
  }
}
