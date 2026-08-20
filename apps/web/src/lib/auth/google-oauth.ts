/**
 * Protocolo Google OAuth 2.0 / OIDC — funções puras (sem Prisma).
 * Login social único. Não pede Drive/Calendar/Gmail.
 */

export const GOOGLE_PROVIDER = "google" as const;
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

export function googleOnboardingRoles(): readonly ["CLIENT", "PARTNER", "ONG"] {
  return ["CLIENT", "PARTNER", "ONG"] as const;
}

export function isAllowedGoogleRole(role: string): role is "CLIENT" | "PARTNER" | "ONG" {
  return role === "CLIENT" || role === "PARTNER" || role === "ONG";
}

/** Nunca auto-vincular só porque o e-mail coincide. */
export function shouldAutoLinkByEmail(): false {
  return false;
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
      "pt-BR": "O Google não cria contas administrativas.",
      en: "Google cannot create admin accounts.",
      es: "Google no crea cuentas de administración.",
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
