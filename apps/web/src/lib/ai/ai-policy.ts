import type { UserRole } from "@prisma/client";
import type { AiModule } from "@/lib/ai/ai-config";

/** Ações que a IA pode apenas preparar — nunca finalizar sozinha. */
export const CRITICAL_ACTIONS = new Set([
  "confirmCheckout",
  "confirmAppointment",
  "requestCancellation",
  "publishPost",
  "sendMessage",
  "updateProfile",
  "deleteEntity",
  "suspendUser",
  "moveFunds",
  "approveAdoption",
  "rejectAdoption",
  "changeOrderStatus",
  "applyDiscount",
]);

/** Módulos permitidos por persona (role normalizado). */
const MODULE_ACCESS: Record<string, readonly AiModule[]> = {
  CLIENT: [
    "ecopet-ai",
    "profile",
    "pets",
    "marketplace",
    "products",
    "services",
    "appointments",
    "orders",
    "cart",
    "social",
    "messages",
    "notifications",
    "search",
    "support",
    "recommendations",
    "accessibility",
    "translation",
  ],
  TUTOR: [
    "ecopet-ai",
    "profile",
    "pets",
    "marketplace",
    "products",
    "services",
    "appointments",
    "orders",
    "cart",
    "social",
    "messages",
    "notifications",
    "search",
    "support",
    "recommendations",
  ],
  PARTNER: [
    "ecopet-ai",
    "profile",
    "partner",
    "products",
    "services",
    "appointments",
    "orders",
    "marketplace",
    "social",
    "messages",
    "notifications",
    "search",
    "reports",
    "support",
  ],
  ONG: [
    "ecopet-ai",
    "profile",
    "ong",
    "pets",
    "social",
    "messages",
    "notifications",
    "search",
    "support",
    "reports",
  ],
  ADMIN: [
    "ecopet-ai",
    "admin",
    "moderation",
    "reports",
    "search",
    "support",
    "automation",
    "translation",
  ],
  GESTOR: [
    "ecopet-ai",
    "admin",
    "moderation",
    "reports",
    "search",
    "support",
    "automation",
  ],
};

export function normalizeAiRole(role: UserRole): string {
  if (role === "TUTOR") return "CLIENT";
  if (role === "GESTOR") return "ADMIN";
  return role;
}

export function canAccessModule(role: UserRole, module: AiModule): boolean {
  const key = normalizeAiRole(role);
  const allowed = MODULE_ACCESS[key] ?? MODULE_ACCESS.CLIENT;
  return allowed.includes(module);
}

export function requiresExplicitConfirmation(action: string): boolean {
  return CRITICAL_ACTIONS.has(action);
}

/** Campos sensíveis que a IA nunca deve alterar. */
export const PROTECTED_PROFILE_FIELDS = new Set([
  "cpf",
  "email",
  "phone",
  "password",
  "passwordHash",
  "role",
  "accountStatus",
]);

/** Regras veterinárias — proibições absolutas nos prompts de pet. */
export const VET_PROHIBITIONS = [
  "Não faça diagnóstico definitivo.",
  "Não prescreva medicamentos nem dosagens.",
  "Não indique tratamento definitivo.",
  "Não substitua avaliação veterinária presencial.",
  "Em sinais de urgência, oriente atendimento veterinário imediato.",
];

export const MARKETPLACE_PROHIBITIONS = [
  "Nunca invente estoque, preço ou avaliação.",
  "Nunca afirme benefício veterinário sem base nos dados.",
  "Recomendação patrocinada deve ser identificada como tal.",
  "Não crie alegações enganosas.",
];
