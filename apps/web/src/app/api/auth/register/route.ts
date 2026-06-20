import { NextResponse } from "next/server";
import { UserRole, AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  sanitizeUser,
  safeUserSelect,
} from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { registerSchema } from "@/schemas/auth";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { emailRegisterCompleted } from "@/lib/mail/event-dispatch";

const ALLOWED_REGISTER_ROLES = [UserRole.CLIENT, UserRole.PARTNER, UserRole.ONG] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      return apiFailure("VALIDATION", first?.message ?? "Dados inválidos", 400);
    }

    const data = parsed.data;

    if (!ALLOWED_REGISTER_ROLES.includes(data.role as (typeof ALLOWED_REGISTER_ROLES)[number])) {
      return apiFailure("FORBIDDEN", "Tipo de cadastro não permitido nesta página.", 403);
    }

    if (data.password !== data.confirmPassword) {
      return apiFailure("VALIDATION", PASSWORD_MISMATCH_MESSAGE, 400);
    }

    const pwdContext =
      data.role === UserRole.CLIENT
        ? {
            email: data.email,
            name: data.name,
            username: data.username,
            phone: data.phone,
            birthDate: data.birthDate,
          }
        : { email: data.email, name: data.name };

    const pwdCheck = validateStrongPassword(data.password, pwdContext);
    if (!pwdCheck.valid) {
      return apiFailure(
        "VALIDATION",
        pwdCheck.error ?? "Senha não atende aos requisitos de segurança.",
        400
      );
    }

    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      return apiFailure(
        "EMAIL_DUPLICATE",
        "Este e-mail já está cadastrado. Faça login ou recupere sua senha.",
        409
      );
    }

    const phoneExists = await prisma.user.findFirst({ where: { phone: data.phone } });
    if (phoneExists) {
      return apiFailure("PHONE_DUPLICATE", "Este telefone já está vinculado a uma conta.", 409);
    }

    if (data.role === UserRole.CLIENT) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
        select: { id: true },
      });
      if (usernameExists) {
        return apiFailure(
          "USERNAME_DUPLICATE",
          "Este nome de usuário já está em uso. Escolha outro.",
          409
        );
      }
    }

    if (data.role === UserRole.CLIENT && data.cpf) {
      const cpfExists = await prisma.user.findUnique({ where: { cpf: data.cpf } });
      if (cpfExists) {
        return apiFailure(
          "CPF_DUPLICATE",
          "Este CPF já está cadastrado. Faça login ou recupere sua senha.",
          409
        );
      }
    }

    if (data.role === UserRole.PARTNER || data.role === UserRole.ONG) {
      const [partnerCnpj, ongCnpj, userCnpj] = await Promise.all([
        prisma.partnerProfile.findUnique({ where: { cnpj: data.cnpj }, select: { id: true } }),
        prisma.ongProfile.findUnique({ where: { cnpj: data.cnpj }, select: { id: true } }),
        prisma.user.findFirst({ where: { cnpj: data.cnpj }, select: { id: true } }),
      ]);
      if (partnerCnpj || ongCnpj || userCnpj) {
        return apiFailure(
          "CNPJ_DUPLICATE",
          "Este CNPJ já está cadastrado. Acesse a conta da organização ou solicite suporte.",
          409
        );
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      if (data.role === UserRole.CLIENT) {
        const genderValue =
          data.gender === "OUTRO" && data.genderOther?.trim()
            ? `Outro: ${data.genderOther.trim()}`
            : data.gender === "MASCULINO"
              ? "Masculino"
              : data.gender === "FEMININO"
                ? "Feminino"
                : data.gender === "NAO_BINARIO"
                  ? "Não Binário"
                  : data.gender === "NAO_DECLARAR"
                    ? "Prefiro Não Declarar"
                    : "Outro";

        return tx.user.create({
          data: {
            name: data.name,
            email: data.email,
            username: data.username,
            passwordHash,
            role: UserRole.CLIENT,
            phone: data.phone,
            gender: genderValue,
            cpf: data.cpf ?? null,
            birthDate: new Date(data.birthDate),
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            state: data.state ?? null,
            accountStatus: AccountStatus.ACTIVE,
            termsAcceptedAt: new Date(),
            lgpdAcceptedAt: new Date(),
          },
          select: { id: true, name: true, email: true, role: true, accountStatus: true },
        });
      }

      if (data.role === UserRole.PARTNER) {
        const created = await tx.user.create({
          data: {
            name: data.name.trim(),
            email: data.email,
            passwordHash,
            role: UserRole.PARTNER,
            phone: data.phone,
            cnpj: data.cnpj,
            accountStatus: AccountStatus.ACTIVE,
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
          select: { id: true, name: true, email: true, role: true, accountStatus: true },
        });
        return created;
      }

      const created = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email,
          passwordHash,
          role: UserRole.ONG,
          phone: data.phone,
          cnpj: data.cnpj,
          accountStatus: AccountStatus.ACTIVE,
          ongProfile: {
            create: {
              ongName: data.ongName.trim(),
              name: data.ongName.trim(),
              responsible: data.responsibleName.trim(),
              responsibleName: data.responsibleName.trim(),
              cnpj: data.cnpj,
              address: data.address.trim(),
              city: data.city.trim(),
              state: data.state,
              institutionalEmail: data.email,
            },
          },
        },
        select: { id: true, name: true, email: true, role: true, accountStatus: true },
      });
      return created;
    });

    const token = await createSessionToken(user.id, user.role, user.accountStatus ?? AccountStatus.ACTIVE);
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });

    const response = apiSuccess(
      {
        message: "Conta criada com sucesso!",
        user: fullUser ? sanitizeUser(fullUser) : user,
        redirectTo: dashboardPathForRole(user.role),
      },
      201
    );

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    void emailRegisterCompleted(user.email, user.name);
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[register:error]", error);
    }
    return apiFailure("UNEXPECTED", "Não foi possível concluir o cadastro. Tente novamente.", 500);
  }
}
