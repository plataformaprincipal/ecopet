import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, sessionCookieOptions, SESSION_COOKIE, sanitizeUser, safeUserSelect } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";

function conflict(message: string, code: string) {
  return NextResponse.json({ error: message, code }, { status: 409 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Dados inválidos", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.password !== data.confirmPassword) {
      return NextResponse.json(
        { error: PASSWORD_MISMATCH_MESSAGE, code: "VALIDATION" },
        { status: 400 }
      );
    }

    const pwdCheck = validateStrongPassword(data.password, {
      email: data.email,
      name: data.name,
    });
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { error: pwdCheck.error ?? "Senha não atende aos requisitos de segurança.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      return conflict("Este e-mail já está cadastrado. Faça login ou recupere sua senha.", "EMAIL_DUPLICATE");
    }

    const phoneExists = await prisma.user.findFirst({ where: { phone: data.phone } });
    if (phoneExists) {
      return conflict("Este telefone já está vinculado a uma conta.", "PHONE_DUPLICATE");
    }

    if (data.role === UserRole.PARTNER) {
      const cnpjExists = await prisma.partnerProfile.findUnique({ where: { cnpj: data.cnpj } });
      if (cnpjExists) {
        return conflict("Este CNPJ já está cadastrado. Acesse a conta da organização ou solicite suporte.", "CNPJ_DUPLICATE");
      }
    }

    if (data.role === UserRole.ONG) {
      const cnpjExists = await prisma.ongProfile.findUnique({ where: { cnpj: data.cnpj } });
      if (cnpjExists) {
        return conflict("Este CNPJ já está cadastrado. Acesse a conta da organização ou solicite suporte.", "CNPJ_DUPLICATE");
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      if (data.role === UserRole.CLIENT) {
        return tx.user.create({
          data: {
            name: data.name.trim(),
            email: data.email,
            passwordHash,
            role: UserRole.CLIENT,
            phone: data.phone,
            birthDate: new Date(data.birthDate),
          },
          select: { id: true, name: true, email: true, role: true },
        });
      }

      if (data.role === UserRole.PARTNER) {
        return tx.user.create({
          data: {
            name: data.name.trim(),
            email: data.email,
            passwordHash,
            role: UserRole.PARTNER,
            phone: data.phone,
            cnpj: data.cnpj,
            partnerProfile: {
              create: {
                businessName: data.businessName.trim(),
                legalName: data.legalName.trim(),
                cnpj: data.cnpj,
                category: data.category.trim(),
                address: data.address.trim(),
                city: data.city.trim(),
                state: data.state,
                responsibleName: data.name.trim(),
                commercialEmail: data.email,
              },
            },
          },
          select: { id: true, name: true, email: true, role: true },
        });
      }

      return tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email,
          passwordHash,
          role: UserRole.ONG,
          phone: data.phone,
          cnpj: data.cnpj,
          ongProfile: {
            create: {
              ongName: data.ongName.trim(),
              cnpj: data.cnpj,
              responsibleName: data.responsibleName.trim(),
              address: data.address.trim(),
              city: data.city.trim(),
              state: data.state,
              institutionalEmail: data.email,
            },
          },
        },
        select: { id: true, name: true, email: true, role: true },
      });
    });

    const token = await createSessionToken(user.id, user.role);
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const response = NextResponse.json(
      { message: "Conta criada com sucesso!", user: fullUser ? sanitizeUser(fullUser) : user },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[register:error]", error);
    }
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente.", code: "UNEXPECTED" },
      { status: 500 }
    );
  }
}
