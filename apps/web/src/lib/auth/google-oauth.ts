/**
 * Protocolo Google OAuth 2.0 / OIDC — funções puras (sem Prisma).
 * Google consumer login é CLIENT ONLY (Tutor). Parceiro e ONG usam e-mail/senha.
 */

import { normalizeRegistrationEmail } from "@/lib/validation/email";

export const GOOGLE_PROVIDER = "google" as const;
export const GOOGLE_AUTH_ALLOWED_ROLE = "CLIENT" as const;
export const GOOGLE_AUTH_SCOPES = "openid email profile";
export const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"] as const;
/** Origem canônica de produção — Google Cloud Authorized JavaScript origin. */
export const GOOGLE_PRODUCTION_ORIGIN = "https://www.eccopet.com";

export type GoogleOAuthIntent = "login" | "register" | "link";

export type GoogleAuthErrorCode =
  | "OAUTH_NOT_CONFIGURED"
  | "CANCELLED"
  | "INVALID_STATE"
  | "INVALID_NONCE"
  | "EMAIL_NOT_VERIFIED"
  | "ACCOUNT_EXISTS_PASSWORD"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_INACTIVE"
  | "LINK_REQUIRED"
  | "LAST_AUTH_METHOD"
  | "ADMIN_FORBIDDEN"
  | "PARTNER_GOOGLE_FORBIDDEN"
  | "ONG_GOOGLE_FORBIDDEN"
  | "GOOGLE_ACCOUNT_IN_USE"
  | "TERMS_REQUIRED"
  | "OPEN_REDIRECT"
  | "TOKEN_INVALID"
  | "GENERIC";

export function isGoogleAuthConfigured(source: Record<string, string | undefined> = process.env): boolean {
  const id = source.GOOGLE_CLIENT_ID?.trim();
  const secret = source.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(id && secret && id.length > 8 && secret.length > 8);
}

export function googleCallbackPath(): string {
  return "/api/auth/google/callback";
}

export function googleStartPath(): string {
  return "/api/auth/google";
}

/** Path interno relativo seguro — previne open redirect. */
export function safeInternalPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.startsWith("/\\")) return fallback;
  if (t.includes("://")) return fallback;
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return fallback;
  if (t.includes("\\") || t.includes("%5c") || t.includes("%2f%2f")) return fallback;
  if (t.length > 512) return fallback;
  return t;
}

export function mapGoogleOAuthError(raw: string | null | undefined): GoogleAuthErrorCode {
  const v = (raw ?? "").toLowerCase();
  if (v === "access_denied") return "CANCELLED";
  if (v === "invalid_state") return "INVALID_STATE";
  if (v === "invalid_nonce") return "INVALID_NONCE";
  if (v.includes("email")) return "EMAIL_NOT_VERIFIED";
  return "GENERIC";
}

export function canUnlinkGoogle(input: { hasPassword: boolean; googleLinked: boolean }): boolean {
  if (!input.googleLinked) return false;
  return input.hasPassword;
}

export function googleOnboardingRoles(): readonly ["CLIENT"] {
  return [GOOGLE_AUTH_ALLOWED_ROLE] as const;
}

export function isAllowedGoogleRole(role: string): role is typeof GOOGLE_AUTH_ALLOWED_ROLE {
  return role === GOOGLE_AUTH_ALLOWED_ROLE;
}

/** O browser nunca escolhe a persona. Google signup/login consumer é sempre CLIENT. */
export function resolveGoogleSignupRole(_requested?: string | null): typeof GOOGLE_AUTH_ALLOWED_ROLE {
  return GOOGLE_AUTH_ALLOWED_ROLE;
}

/**
 * Auto-link estritamente controlado:
 * provider=google + email_verified + role CLIENT + e-mails normalizados iguais.
 */
export function shouldAutoLinkByEmail(params: {
  provider: string;
  emailVerified: boolean;
  existingRole: string;
  googleEmail: string;
  userEmail: string;
}): boolean {
  if (params.provider !== GOOGLE_PROVIDER) return false;
  if (params.emailVerified !== true) return false;
  if (params.existingRole !== GOOGLE_AUTH_ALLOWED_ROLE) return false;
  return normalizeRegistrationEmail(params.googleEmail) === normalizeRegistrationEmail(params.userEmail);
}

export function googleErrorForExistingNonClientRole(role: string): GoogleAuthErrorCode {
  if (role === "PARTNER") return "PARTNER_GOOGLE_FORBIDDEN";
  if (role === "ONG") return "ONG_GOOGLE_FORBIDDEN";
  return "ADMIN_FORBIDDEN";
}

export type GoogleCallbackFacts = {
  identity: { sub: string; email: string; emailVerified: boolean };
  intent: GoogleOAuthIntent;
  currentUser: { id: string; role: string; email: string } | null;
  existingGoogleLink: { userId: string; role: string; accountStatus: string } | null;
  emailOwner: { id: string; role: string; email: string; accountStatus: string } | null;
};

export type GoogleCallbackDecision =
  | { kind: "session"; userId: string }
  | { kind: "autolink"; userId: string }
  | { kind: "pending" }
  | { kind: "error"; code: GoogleAuthErrorCode };

function googleAccountUsable(status: string): GoogleAuthErrorCode | null {
  if (status === "SUSPENDED") return "ACCOUNT_SUSPENDED";
  if (status !== "ACTIVE" && status !== "PENDING") return "ACCOUNT_INACTIVE";
  return null;
}

export function decideGoogleCallback(facts: GoogleCallbackFacts): GoogleCallbackDecision {
  const { identity, intent, currentUser, existingGoogleLink, emailOwner } = facts;
  if (!identity.emailVerified) return { kind: "error", code: "EMAIL_NOT_VERIFIED" };

  if (existingGoogleLink) {
    if (existingGoogleLink.role !== GOOGLE_AUTH_ALLOWED_ROLE) {
      return { kind: "error", code: googleErrorForExistingNonClientRole(existingGoogleLink.role) };
    }
    const statusError = googleAccountUsable(existingGoogleLink.accountStatus);
    if (statusError) return { kind: "error", code: statusError };
    if (intent === "link" && currentUser && currentUser.id !== existingGoogleLink.userId) {
      return { kind: "error", code: "GOOGLE_ACCOUNT_IN_USE" };
    }
    return { kind: "session", userId: existingGoogleLink.userId };
  }

  if (intent === "link") {
    if (!currentUser) return { kind: "error", code: "GENERIC" };
    if (currentUser.role !== GOOGLE_AUTH_ALLOWED_ROLE) {
      return { kind: "error", code: googleErrorForExistingNonClientRole(currentUser.role) };
    }
    return { kind: "autolink", userId: currentUser.id };
  }

  if (emailOwner) {
    if (emailOwner.role !== GOOGLE_AUTH_ALLOWED_ROLE) {
      return { kind: "error", code: googleErrorForExistingNonClientRole(emailOwner.role) };
    }
    const statusError = googleAccountUsable(emailOwner.accountStatus);
    if (statusError) return { kind: "error", code: statusError };
    if (
      shouldAutoLinkByEmail({
        provider: GOOGLE_PROVIDER,
        emailVerified: identity.emailVerified,
        existingRole: emailOwner.role,
        googleEmail: identity.email,
        userEmail: emailOwner.email,
      })
    ) {
      return { kind: "autolink", userId: emailOwner.id };
    }
    return { kind: "error", code: "ACCOUNT_EXISTS_PASSWORD" };
  }

  return { kind: "pending" };
}

export function canCompleteGoogleOnboarding(params: {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}): { ok: true } | { ok: false; code: "TERMS_REQUIRED" } {
  if (!params.termsAccepted || !params.privacyAccepted) return { ok: false, code: "TERMS_REQUIRED" };
  return { ok: true };
}

export function humanGoogleAuthError(code: GoogleAuthErrorCode, locale: "pt-BR" | "en" | "es" = "pt-BR"): string {
  const table: Record<GoogleAuthErrorCode, Record<"pt-BR" | "en" | "es", string>> = {
    OAUTH_NOT_CONFIGURED: {
      "pt-BR": "Entrar com Google ainda não está disponível neste ambiente.",
      en: "Google sign-in is not available in this environment yet.",
      es: "Iniciar sesión con Google no está disponible en este entorno.",
    },
    CANCELLED: {
      "pt-BR": "Nenhuma conta foi criada porque você cancelou o acesso.",
      en: "No account was created because you cancelled access.",
      es: "No se creó ninguna cuenta porque cancelaste el acceso.",
    },
    INVALID_STATE: {
      "pt-BR": "Não foi possível entrar com o Google. Tente novamente.",
      en: "Could not sign in with Google. Please try again.",
      es: "No fue posible entrar con Google. Inténtalo de nuevo.",
    },
    INVALID_NONCE: {
      "pt-BR": "Não foi possível entrar com o Google. Tente novamente.",
      en: "Could not sign in with Google. Please try again.",
      es: "No fue posible entrar con Google. Inténtalo de nuevo.",
    },
    EMAIL_NOT_VERIFIED: {
      "pt-BR": "O Google precisa confirmar este e-mail antes de continuar.",
      en: "Google must verify this email before continuing.",
      es: "Google debe confirmar este correo antes de continuar.",
    },
    ACCOUNT_EXISTS_PASSWORD: {
      "pt-BR":
        "Já existe uma conta EccoPet com este e-mail. Entre com sua senha para conectar o Google com segurança.",
      en: "An EccoPet account already exists with this email. Sign in with your password to link Google securely.",
      es: "Ya existe una cuenta EccoPet con este correo. Entra con tu contraseña para conectar Google de forma segura.",
    },
    ACCOUNT_SUSPENDED: {
      "pt-BR": "Esta conta está suspensa e não pode entrar pelo Google.",
      en: "This account is suspended and cannot sign in with Google.",
      es: "Esta cuenta está suspendida y no puede entrar con Google.",
    },
    ACCOUNT_INACTIVE: {
      "pt-BR": "Esta conta não está ativa.",
      en: "This account is not active.",
      es: "Esta cuenta no está activa.",
    },
    LINK_REQUIRED: {
      "pt-BR":
        "Já existe uma conta EccoPet com este e-mail. Entre com sua senha para conectar o Google com segurança.",
      en: "An EccoPet account already exists with this email. Sign in with your password to link Google securely.",
      es: "Ya existe una cuenta EccoPet con este correo. Entra con tu contraseña para conectar Google de forma segura.",
    },
    LAST_AUTH_METHOD: {
      "pt-BR": "Defina uma senha antes de desconectar o Google.",
      en: "Set a password before disconnecting Google.",
      es: "Define una contraseña antes de desconectar Google.",
    },
    ADMIN_FORBIDDEN: {
      "pt-BR": "Esta conta não pode entrar com Google. Use o login administrativo.",
      en: "This account cannot sign in with Google. Use the admin login.",
      es: "Esta cuenta no puede entrar con Google. Usa el acceso administrativo.",
    },
    PARTNER_GOOGLE_FORBIDDEN: {
      "pt-BR": "Esta conta pertence a um Parceiro EccoPet. Entre com seu e-mail e senha.",
      en: "This account belongs to an EccoPet Partner. Sign in with your email and password.",
      es: "Esta cuenta pertenece a un Socio EccoPet. Entra con tu correo y contraseña.",
    },
    ONG_GOOGLE_FORBIDDEN: {
      "pt-BR": "Esta conta pertence a uma ONG EccoPet. Entre com seu e-mail e senha.",
      en: "This account belongs to an EccoPet NGO. Sign in with your email and password.",
      es: "Esta cuenta pertenece a una ONG EccoPet. Entra con tu correo y contraseña.",
    },
    GOOGLE_ACCOUNT_IN_USE: {
      "pt-BR": "Esta conta Google já está vinculada a outro usuário EccoPet.",
      en: "This Google account is already linked to another EccoPet user.",
      es: "Esta cuenta de Google ya está vinculada a otro usuario EccoPet.",
    },
    TERMS_REQUIRED: {
      "pt-BR": "Aceite os Termos de Uso e a Política de Privacidade para continuar.",
      en: "Accept the Terms of Use and Privacy Policy to continue.",
      es: "Acepta los Términos de Uso y la Política de Privacidad para continuar.",
    },
    OPEN_REDIRECT: {
      "pt-BR": "Destino de retorno inválido.",
      en: "Invalid return destination.",
      es: "Destino de retorno inválido.",
    },
    TOKEN_INVALID: {
      "pt-BR": "Não foi possível entrar com o Google. Tente novamente.",
      en: "Could not sign in with Google. Please try again.",
      es: "No fue posible entrar con Google. Inténtalo de nuevo.",
    },
    GENERIC: {
      "pt-BR": "Não foi possível entrar com o Google. Tente novamente.",
      en: "Could not sign in with Google. Please try again.",
      es: "No fue posible entrar con Google. Inténtalo de nuevo.",
    },
  };
  return table[code][locale];
}
