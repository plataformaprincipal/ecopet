/**
 * Orquestração server-side de capabilities — sobre o provider OpenAI existente.
 * Puro (sem I/O) para testes e para o stream autenticado / public-chat.
 */

import type { UserRole } from "@prisma/client";
import { REGISTERED_AI_TOOL_NAMES } from "./tool-names";
import {
  getCapability,
  resolveCapabilityAvailability,
  type AiCapabilityDefinition,
  type CapabilityUserContext,
  type ResolvedCapability,
} from "./registry";

export const CONCIERGE_CAPABILITY_ID = "concierge";

export const WORKSPACE_CAPABILITY_IDS = ["lost_pet", "travel_agent", "content_studio"] as const;

export type WorkspaceCapabilityId = (typeof WORKSPACE_CAPABILITY_IDS)[number];

export function isWorkspaceCapability(id: string | null | undefined): id is WorkspaceCapabilityId {
  return Boolean(id && (WORKSPACE_CAPABILITY_IDS as readonly string[]).includes(id));
}

export function normalizeCapabilityId(raw?: string | null): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const id = raw.trim().toLowerCase().replace(/-/g, "_").slice(0, 64);
  return id || undefined;
}

export function capabilityContextFromRole(input: {
  role: UserRole | "GUEST";
  hasPet: boolean;
  hasGeo: boolean;
  aiConfigured: boolean;
  isGuest?: boolean;
}): CapabilityUserContext {
  const isGuest = input.isGuest ?? input.role === "GUEST";
  return {
    isGuest,
    isPartner: input.role === "PARTNER",
    isOng: input.role === "ONG",
    isAdmin: input.role === "ADMIN",
    hasPet: input.hasPet,
    hasGeo: input.hasGeo,
    aiConfigured: input.aiConfigured,
  };
}

export type ServerCapabilityOk = {
  status: "ok";
  capability: ResolvedCapability;
  allowedTools: string[];
  extraSystemPrompt: string;
  fallbackFromInvalid?: boolean;
};

export type ServerCapabilityDenied = {
  status: "denied";
  code: "CAPABILITY_DISABLED" | "CAPABILITY_LOCKED" | "CAPABILITY_INVALID";
  message: string;
  capability?: ResolvedCapability;
  lockReason?: ResolvedCapability["lockReason"];
};

export type ServerCapabilityDecision = ServerCapabilityOk | ServerCapabilityDenied;

function copyForLocale(locale?: string) {
  const lang = (locale ?? "pt-BR").toLowerCase();
  if (lang.startsWith("en")) {
    return {
      disabled: "This function is not available right now.",
      lockedLogin: "Sign in to access your data and continue.",
      lockedPet: "Register a pet to use this function.",
      lockedPartner: "This function is available for partners only.",
      lockedLocation: "Set a location to continue.",
    };
  }
  if (lang.startsWith("es")) {
    return {
      disabled: "Esta función no está disponible en este momento.",
      lockedLogin: "Inicia sesión para acceder a tus datos y continuar.",
      lockedPet: "Registra una mascota para usar esta función.",
      lockedPartner: "Esta función es exclusiva para socios.",
      lockedLocation: "Define una ubicación para continuar.",
    };
  }
  return {
    disabled: "Esta função não está disponível no momento.",
    lockedLogin: "Entre para acessar seus dados e continuar.",
    lockedPet: "Cadastre um pet para usar esta função.",
    lockedPartner: "Esta função é exclusiva para parceiros.",
    lockedLocation: "Informe uma localização para continuar.",
  };
}

function lockedMessage(
  reason: ResolvedCapability["lockReason"],
  locale?: string
): string {
  const copy = copyForLocale(locale);
  if (reason === "login") return copy.lockedLogin;
  if (reason === "pet") return copy.lockedPet;
  if (reason === "partner") return copy.lockedPartner;
  if (reason === "location") return copy.lockedLocation;
  return copy.disabled;
}

export function buildCapabilitySystemPrompt(cap: AiCapabilityDefinition): string {
  const lines = [
    `Capacidade ativa: ${cap.id}.`,
    `Use somente as ferramentas desta allowlist: ${cap.tools.join(", ") || "(nenhuma)"}.`,
    "Não invente dados, estoque, preços, GPS, regras sanitárias ou resultados de ferramentas.",
    ...cap.safetyRules,
  ];

  const extras: Record<string, string> = {
    care_navigator:
      "Care Navigator: apenas organização informativa. Nunca diagnostique, prescreva, defina dose ou altere medicamento. Encaminhe ao veterinário quando houver sinal de alerta.",
    shopping_agent:
      "Shopping Agent: priorize produtos reais, preço informado pela ferramenta, compatibilidade e localização. Não invente frete, estoque ou avaliações. Identifique itens patrocinados se o dado existir.",
    adoption_assistant:
      "Adoption Assistant: use filtros reais de adoção. Oriente adoção responsável. Não invente animais disponíveis.",
    lost_pet:
      "Lost Pet Agent: oriente busca. Não invente coordenadas GPS nem afirmações de localização real do animal. Raio sugerido é orientação, não tracking.",
    travel_agent:
      "Travel Agent: organize checklist e pendências. Não invente regra sanitária, exigência alfandegária, companhia aérea, preço ou disponibilidade. Itens legais devem ser marcados como 'confirme as regras do destino'.",
    content_studio:
      "Content Studio: gere texto (legenda, descrição, tradução, reescrita). Não publique automaticamente. Não use histórico médico em legendas. Rotule conteúdo gerado por IA quando apropriado.",
    concierge:
      "EccoPet Concierge: navegue produtos, serviços, pedidos e agenda com tools reais. Não execute ações irreversíveis sem confirmação.",
    routine_coach:
      "Routine Coach: rotina, lembretes e agenda. Não prescreva alimentação clínica.",
  };

  const extra = extras[cap.id];
  if (extra) lines.push(extra);
  return lines.filter(Boolean).join("\n");
}

function toOk(
  cap: AiCapabilityDefinition | ResolvedCapability,
  ctx: CapabilityUserContext,
  fallbackFromInvalid?: boolean
): ServerCapabilityOk {
  const resolved =
    "availability" in cap ? cap : resolveCapabilityAvailability(cap, ctx);
  return {
    status: "ok",
    capability: resolved,
    allowedTools: resolved.tools.filter((t) => REGISTERED_AI_TOOL_NAMES.has(t)),
    extraSystemPrompt: buildCapabilitySystemPrompt(resolved),
    fallbackFromInvalid,
  };
}

/**
 * Resolve capabilityId enviado pelo cliente.
 * Nunca confia no frontend: valida audience, auth, pet, flags e backend.
 * ID inexistente → fallback seguro para Concierge (não para capability privilegiada).
 */
export function resolveServerCapability(input: {
  capabilityId?: string | null;
  role: UserRole | "GUEST";
  hasPet: boolean;
  hasGeo: boolean;
  aiConfigured: boolean;
  isGuest?: boolean;
  locale?: string;
}): ServerCapabilityDecision {
  const ctx = capabilityContextFromRole(input);
  const copy = copyForLocale(input.locale);
  const rawId = normalizeCapabilityId(input.capabilityId);
  const concierge = getCapability(CONCIERGE_CAPABILITY_ID);

  if (!rawId) {
    if (!concierge) {
      return { status: "denied", code: "CAPABILITY_INVALID", message: copy.disabled };
    }
    return toOk(concierge, ctx);
  }

  const cap = getCapability(rawId);
  if (!cap) {
    if (!concierge) {
      return { status: "denied", code: "CAPABILITY_INVALID", message: copy.disabled };
    }
    return toOk(concierge, ctx, true);
  }

  const resolved = resolveCapabilityAvailability(cap, ctx);

  if (resolved.availability === "disabled") {
    return {
      status: "denied",
      code: "CAPABILITY_DISABLED",
      message: copy.disabled,
      capability: resolved,
    };
  }

  if (resolved.availability === "locked") {
    return {
      status: "denied",
      code: "CAPABILITY_LOCKED",
      message: lockedMessage(resolved.lockReason, input.locale),
      capability: resolved,
      lockReason: resolved.lockReason,
    };
  }

  return toOk(resolved, ctx);
}

export function isToolAllowedForCapability(
  allowedTools: string[] | undefined,
  toolName: string
): boolean {
  if (!allowedTools) return true;
  return allowedTools.includes(toolName);
}

export function filterToolsByAllowlist<T extends { name: string }>(
  tools: T[],
  allowedTools?: string[]
): T[] {
  if (!allowedTools) return tools;
  const allow = new Set(allowedTools);
  return tools.filter((t) => allow.has(t.name));
}
