import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logMailError, sendPasswordResetEmail } from "@/lib/mail";
import { generateResetToken, hashResetToken, resetExpiresAt, resetPasswordLink } from "@/lib/password-reset";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { FORGOT_PASSWORD_GENERIC_MESSAGE } from "@/lib/constants/auth-messages";
import { forgotPasswordSchema } from "@/lib/validations/password-reset";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_IP = 10;
const RATE_LIMIT_EMAIL = 5;

function genericResponse() {
  return NextResponse.json({ message: FORGOT_PASSWORD_GENERIC_MESSAGE });
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkRateLimit(`forgot:ip:${ip}`, RATE_LIMIT_IP, RATE_WINDOW_MS)) {
      return genericResponse();
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return genericResponse();
    }

    const { email } = parsed.data;

    if (!checkRateLimit(`forgot:email:${email}`, RATE_LIMIT_EMAIL, RATE_WINDOW_MS)) {
      return genericResponse();
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return genericResponse();
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
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (mailError) {
      logMailError("forgot-password", mailError);
    }

    return genericResponse();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[forgot-password:error]", error);
    }
    return genericResponse();
  }
}
