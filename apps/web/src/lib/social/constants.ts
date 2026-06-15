export const SOCIAL_POST_MAX_CONTENT = 5000;
export const SOCIAL_COMMENT_MAX_CONTENT = 2000;
export const SOCIAL_POST_MAX_MEDIA = 10;
export const SOCIAL_FEED_DEFAULT_LIMIT = 20;
export const SOCIAL_COMMENTS_DEFAULT_LIMIT = 30;

export const SOCIAL_RATE_LIMITS = {
  createPost: { limit: 10, windowMs: 60_000 },
  comment: { limit: 30, windowMs: 60_000 },
  report: { limit: 10, windowMs: 60_000 },
  follow: { limit: 30, windowMs: 60_000 },
  share: { limit: 20, windowMs: 60_000 },
} as const;

export const SOCIAL_ALLOWED_POST_ROLES = ["CLIENT", "PARTNER", "ONG", "ADMIN"] as const;

export const SOCIAL_ROLE_LABELS: Record<string, string> = {
  CLIENT: "Tutor",
  PARTNER: "Parceiro",
  ONG: "ONG",
  ADMIN: "Administrador",
  TUTOR: "Tutor",
  VETERINARIAN: "Veterinário",
  CLINIC: "Clínica",
  PETSHOP: "Pet Shop",
  SELLER: "Vendedor",
  SERVICE_PROVIDER: "Prestador",
  GESTOR: "Gestor",
};
