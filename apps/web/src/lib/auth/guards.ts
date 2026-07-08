import { AccountStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { getCurrentUser, type SafeUser } from "@/lib/auth";
import { getAuthoritativeAccountStatus } from "@/lib/account-status-server";
import { apiFailure } from "@/lib/api-response";
import { auditAdminAccessDenied } from "@/lib/auth/auth-audit";

export type GuardUser = SafeUser;

export type ApiGuardResult = {
  user: GuardUser | null;
  error: NextResponse | null;
};

type BaseGuardOptions = {
  roles?: readonly UserRole[];
  requireActive?: boolean;
};

async function resolveGuardUser(): Promise<GuardUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const authoritative = await getAuthoritativeAccountStatus(user.id);
  if (!authoritative) return null;

  return {
    ...user,
    role: authoritative.role,
    accountStatus: authoritative.accountStatus,
  };
}

async function baseGuard(options: BaseGuardOptions = {}): Promise<ApiGuardResult> {
  const sessionUser = await resolveGuardUser();
  if (!sessionUser) {
    return {
      user: null,
      error: apiFailure("UNAUTHORIZED", "Sessão expirada. Faça login novamente.", 401),
    };
  }

  if (sessionUser.accountStatus === AccountStatus.SUSPENDED) {
    return { user: null, error: apiFailure("ACCOUNT_SUSPENDED", "Conta suspensa.", 403) };
  }
  if (sessionUser.accountStatus === AccountStatus.REJECTED) {
    return { user: null, error: apiFailure("ACCOUNT_REJECTED", "Conta rejeitada.", 403) };
  }

  if (options.roles?.length && !options.roles.includes(sessionUser.role)) {
    return { user: null, error: apiFailure("FORBIDDEN", "Sem permissão.", 403) };
  }

  if (options.requireActive && sessionUser.accountStatus !== AccountStatus.ACTIVE) {
    return {
      user: null,
      error: apiFailure(
        "FORBIDDEN",
        sessionUser.role === UserRole.ADMIN
          ? "Conta administrativa inativa. Entre em contato com o suporte da plataforma."
          : "Conta inativa.",
        403
      ),
    };
  }

  return { user: sessionUser, error: null };
}

/** API guard — qualquer usuário autenticável (exceto suspensa/rejeitada). */
export async function requireAuth(): Promise<ApiGuardResult> {
  return baseGuard();
}

/** API guard — exige um dos papéis informados. */
export async function requireRole(...roles: UserRole[]): Promise<ApiGuardResult> {
  return baseGuard({ roles });
}

/** API guard — ADMIN com accountStatus ACTIVE. */
export async function requireAdmin(context?: { path?: string }): Promise<ApiGuardResult> {
  const result = await baseGuard({ roles: [UserRole.ADMIN], requireActive: true });
  if (result.error) {
    const actor = await getCurrentUser();
    void auditAdminAccessDenied({
      userId: actor?.id,
      path: context?.path,
    });
  }
  return result;
}

/** API guard — PARTNER. */
export async function requirePartner(): Promise<ApiGuardResult> {
  return baseGuard({ roles: [UserRole.PARTNER] });
}

/** API guard — ONG. */
export async function requireNgo(): Promise<ApiGuardResult> {
  return baseGuard({ roles: [UserRole.ONG] });
}

/** Server component/layout guard — redireciona para login ou /unauthorized. */
export async function guardAuth(callbackUrl: string): Promise<GuardUser> {
  const sessionUser = await resolveGuardUser();
  if (!sessionUser) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (
    sessionUser.accountStatus === AccountStatus.SUSPENDED ||
    sessionUser.accountStatus === AccountStatus.REJECTED
  ) {
    redirect("/unauthorized");
  }
  return sessionUser;
}

/** Server component/layout guard — exige papel específico. */
export async function guardRole(
  roles: readonly UserRole[],
  callbackUrl: string
): Promise<GuardUser> {
  const sessionUser = await guardAuth(callbackUrl);
  if (!roles.includes(sessionUser.role)) {
    redirect("/unauthorized");
  }
  return sessionUser;
}

/** Server component/layout guard — painel administrativo. */
export async function guardAdmin(callbackUrl = "/admin"): Promise<GuardUser> {
  const sessionUser = await guardRole([UserRole.ADMIN], callbackUrl);
  if (sessionUser.accountStatus !== AccountStatus.ACTIVE) {
    redirect("/perfil");
  }
  return sessionUser;
}

/** Server component/layout guard — experiência parceiro. */
export async function guardPartner(callbackUrl = "/partner"): Promise<GuardUser> {
  return guardRole([UserRole.PARTNER], callbackUrl);
}

/** Server component/layout guard — experiência ONG. */
export async function guardNgo(callbackUrl = "/ngo"): Promise<GuardUser> {
  return guardRole([UserRole.ONG], callbackUrl);
}
