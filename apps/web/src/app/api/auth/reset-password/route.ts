import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/password-reset";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/password-reset";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-session";

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
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  const record = await findActiveToken(token);

  if (!record) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  if (record.usedAt) {
    return NextResponse.json({ valid: false, reason: "used" });
  }

  if (record.expiresAt <= new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({
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
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const { token, password, confirmPassword } = parsed.data;
    const record = await findActiveToken(token);

    if (!record) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite uma nova redefinição.", code: "TOKEN_INVALID" },
        { status: 400 }
      );
    }

    if (record.usedAt) {
      return NextResponse.json(
        { error: "Este link já foi utilizado. Solicite uma nova redefinição.", code: "TOKEN_USED" },
        { status: 400 }
      );
    }

    if (record.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Link expirado. Solicite uma nova redefinição.", code: "TOKEN_EXPIRED" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: PASSWORD_MISMATCH_MESSAGE, code: "VALIDATION" },
        { status: 400 }
      );
    }

    const pwdCheck = validateStrongPassword(password, {
      email: record.user.email,
      name: record.user.name,
    });
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { error: pwdCheck.error ?? "Senha não atende aos requisitos de segurança.", code: "VALIDATION" },
        { status: 400 }
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

    const response = NextResponse.json({
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });

    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[reset-password:error]", error);
    }
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha. Tente novamente.", code: "UNEXPECTED" },
      { status: 500 }
    );
  }
}
