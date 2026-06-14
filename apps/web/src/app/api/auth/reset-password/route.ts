import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/password-reset";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/schemas/password-reset";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-session";
import { apiSuccess, apiFailure } from "@/lib/api-response";

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_IP = 20;

async function findActiveToken(token: string) {
  const tokenHash = hashResetToken(token);
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return apiFailure("TOKEN_INVALID", "Link inválido.", 400);
  }

  const record = await findActiveToken(token);

  if (!record) {
    return apiFailure("TOKEN_INVALID", "Link inválido ou expirado.", 400);
  }

  if (record.usedAt) {
    return apiFailure("TOKEN_USED", "Este link já foi utilizado.", 400);
  }

  if (record.expiresAt <= new Date()) {
    return apiFailure("TOKEN_EXPIRED", "Link expirado.", 400);
  }

  return apiSuccess({
    valid: true,
    passwordContext: {
      email: record.user.email,
      name: record.user.name,
    },
  });
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!checkRateLimit(`reset:ip:${ip}`, RATE_LIMIT_IP, RATE_WINDOW_MS)) {
      return apiFailure("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const { token, password, confirmPassword } = parsed.data;
    const record = await findActiveToken(token);

    if (!record) {
      return apiFailure(
        "TOKEN_INVALID",
        "Link inválido ou expirado. Solicite uma nova redefinição.",
        400
      );
    }

    if (record.usedAt) {
      return apiFailure(
        "TOKEN_USED",
        "Este link já foi utilizado. Solicite uma nova redefinição.",
        400
      );
    }

    if (record.expiresAt <= new Date()) {
      return apiFailure(
        "TOKEN_EXPIRED",
        "Link expirado. Solicite uma nova redefinição.",
        400
      );
    }

    if (password !== confirmPassword) {
      return apiFailure("VALIDATION", PASSWORD_MISMATCH_MESSAGE, 400);
    }

    const pwdCheck = validateStrongPassword(password, {
      email: record.user.email,
      name: record.user.name,
    });
    if (!pwdCheck.valid) {
      return apiFailure(
        "VALIDATION",
        pwdCheck.error ?? "Senha não atende aos requisitos de segurança.",
        400
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          id: { not: record.id },
          usedAt: null,
        },
        data: { usedAt: now },
      }),
    ]);

    const response = apiSuccess({
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });

    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[reset-password:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível redefinir a senha. Tente novamente.", 500);
  }
}
