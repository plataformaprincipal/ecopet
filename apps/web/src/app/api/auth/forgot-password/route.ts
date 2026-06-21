import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit, clientIp } from "@/lib/rate-limit";
import {
  FORGOT_PASSWORD_GENERIC_MESSAGE,
  FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE,
  FORGOT_PASSWORD_SEND_FAILED_MESSAGE,
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
import { logRecoveryAudit } from "@/lib/auth/recovery-audit";
import { exposeDevOtp, writeDevOtpFile } from "@/lib/auth/recovery-otp-dev";
import { sendPasswordRecoveryOtpEmail } from "@/lib/email/password-recovery-email";
import { getResendApiKey, getResendFromAddress } from "@/lib/email/resend";
import { getUserEmailLocale } from "@/lib/email/templates";
import {
  blockRecovery,
  checkRecoveryRequestLimit,
  isRecoveryBlocked,
  RECOVERY_BLOCKED_MESSAGE,
  RECOVERY_RATE_LIMIT_MESSAGE,
} from "@/lib/auth/recovery-security";
import { sendPasswordResetSms } from "@/lib/sms/provider";
import { isTwilioConfigured, maskPhoneForLog } from "@/lib/sms/twilio";

function envSmsProviderIsTwilioButMissing(): boolean {
  return process.env.SMS_PROVIDER?.trim().toLowerCase() === "twilio" && !isTwilioConfigured();
}

const RATE_LIMIT_IP = 20;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function genericRecoveryResponse(channel: "email" | "phone", devOtp?: string) {
  return apiSuccess({
    message: FORGOT_PASSWORD_GENERIC_MESSAGE,
    channel,
    ...(devOtp ? { devOtp } : {}),
  });
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkAuthRateLimit(`forgot:ip:${ip}`, RATE_LIMIT_IP, RATE_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", RECOVERY_BLOCKED_MESSAGE, 429);
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { identifier } = parsed.data;
    const recovery = parseRecoveryIdentifier(identifier);
    const channel = recovery.type === "email" ? "email" : "phone";

    if (isRecoveryBlocked(identifier)) {
      await logRecoveryAudit({ event: "blocked", ip, metadata: { identifier: recovery.type } });
      return apiFailure("RATE_LIMIT", RECOVERY_BLOCKED_MESSAGE, 429);
    }

    if (!checkRecoveryRequestLimit(identifier)) {
      blockRecovery(identifier);
      await logRecoveryAudit({ event: "blocked", ip, metadata: { reason: "request_limit" } });
      return apiFailure("RATE_LIMIT", RECOVERY_RATE_LIMIT_MESSAGE, 429);
    }

    if (recovery.type === "phone" && !isPhoneSmsRecoveryEnabled()) {
      return apiFailure("PHONE_RECOVERY_UNAVAILABLE", FORGOT_PASSWORD_PHONE_UNAVAILABLE_MESSAGE, 503);
    }

    if (recovery.type === "phone" && envSmsProviderIsTwilioButMissing()) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[forgot-password:sms] Twilio não configurado (variáveis ausentes).");
      }
      return apiFailure("SEND_FAILED", FORGOT_PASSWORD_SEND_FAILED_MESSAGE, 503);
    }

    const user = await findUserByRecoveryIdentifier(prisma, identifier);

    if (!user) {
      return genericRecoveryResponse(channel);
    }

    const now = new Date();

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    await prisma.verificationCode.updateMany({
      where: { userId: user.id, purpose: VERIFICATION_PURPOSE_PASSWORD_RESET, used: false },
      data: { used: true },
    });

    const otp = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: hashVerificationCode(otp),
        purpose: VERIFICATION_PURPOSE_PASSWORD_RESET,
        expiresAt: verificationExpiresAt(now),
      },
    });

    if (channel === "email") {
      console.log("[forgot-password] RESEND_API_KEY carregada:", Boolean(getResendApiKey()));
      console.log("[forgot-password] EMAIL_FROM:", getResendFromAddress());

      const emailResult = await sendPasswordRecoveryOtpEmail(user.email, otp, {
        name: user.name,
        locale: getUserEmailLocale(user.preferences),
      });

      if (!emailResult.sent) {
        return apiFailure("SEND_FAILED", FORGOT_PASSWORD_SEND_FAILED_MESSAGE, 503);
      }

      if (process.env.NODE_ENV !== "production" && emailResult.emailId) {
        console.log("[forgot-password] E-mail id:", emailResult.emailId);
      }
    } else if (user.phone) {
      const smsResult = await sendPasswordResetSms(user.phone, otp);

      if (!smsResult.sent) {
        if (smsResult.devOnly && process.env.NODE_ENV !== "production") {
          console.info(`[forgot-password] SMS dev-only para ${maskPhoneForLog(user.phone)}`);
        } else if (!smsResult.devOnly) {
          return apiFailure("SEND_FAILED", FORGOT_PASSWORD_SEND_FAILED_MESSAGE, 503);
        }
      } else if (process.env.NODE_ENV !== "production" && smsResult.messageSid) {
        console.log("[forgot-password] SMS Twilio SID:", smsResult.messageSid);
      }
    }

    writeDevOtpFile(otp);
    await logRecoveryAudit({ userId: user.id, event: "request", channel, ip });

    const devOtp = exposeDevOtp(otp);
    return genericRecoveryResponse(channel, devOtp);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[forgot-password:error]",
        error instanceof Error ? error.message : "erro inesperado"
      );
    }
    return apiFailure("UNEXPECTED", "Não foi possível processar sua solicitação. Tente novamente.", 500);
  }
}
