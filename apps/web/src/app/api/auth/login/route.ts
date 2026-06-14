import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  sanitizeUser,
  safeUserSelect,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Usuário ou senha incorretos.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user.id, user.role);

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const response = NextResponse.json({
      message: "Login realizado com sucesso.",
      user: fullUser ? sanitizeUser(fullUser) : { id: user.id, email: user.email, role: user.role, name: user.name },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[login:error]", error);
    }
    return NextResponse.json(
      { error: "Não foi possível fazer login. Tente novamente.", code: "UNEXPECTED" },
      { status: 500 }
    );
  }
}
