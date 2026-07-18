/**
 * Phase 1 — status tipado e resolução de disponibilidade por provedor.
 * Env presence only (sem live calls).
 */

import {
  getIntegrationProviderDefinition,
  INTEGRATION_PROVIDER_REGISTRY,
  type IntegrationProviderDefinition,
} from "@/lib/integrations/integration-registry";
import {
  hasRealEnv,
  isAiGloballyEnabled,
  isPlaceholderValue,
  PROVIDER_CONFIGURED_CHECKERS,
  readEnv,
  type EnvSource,
} from "@/lib/integrations/integration-config";
import {
  codeForProvider,
  IntegrationError,
  INTEGRATION_ERROR_CODES,
} from "@/lib/integrations/integration-errors";
import { getResendOperationalStatus } from "@/lib/email/resend-status";
import { getMercadoPagoSanitizedStatus } from "@/lib/mercado-pago/config";

export type IntegrationState =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "AVAILABLE"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "DISABLED"
  /** Resend / e-mail — domínio DNS ainda não verificado */
  | "DOMAIN_PENDING"
  /** Resend — domínio verificado e operacional */
  | "ACTIVE"
  | "ERROR"
  /** Mercado Pago — ambiente TEST pronto */
  | "TEST_READY"
  /** Mercado Pago — webhook ainda não cadastrado */
  | "WEBHOOK_PENDING"
  | "AUTH_ERROR"
  | "WEBHOOK_ERROR";

export type IntegrationStatus = {
  provider: string;
  displayName: string;
  configured: boolean;
  available: boolean;
  status: IntegrationState;
  missingVariables: string[];
  lastCheckedAt?: string;
  sanitizedError?: string;
  capabilities: string[];
};

export type PublicIntegrationCapability = {
  provider: string;
  displayName: string;
  category: string;
  available: boolean;
  capabilities: string[];
};

function missingForProvider(
  def: IntegrationProviderDefinition,
  source: EnvSource
): string[] {
  if (def.id === "openai") {
    const missing: string[] = [];
    if (!isAiGloballyEnabled(source)) {
      missing.push("AI_ENABLED");
    }
    const key = readEnv("OPENAI_API_KEY", source);
    if (!key || isPlaceholderValue(key)) {
      missing.push("OPENAI_API_KEY");
    }
    return missing;
  }

  if (def.id === "twilio") {
    const missing: string[] = [];
    if (readEnv("SMS_PROVIDER", source)?.toLowerCase() !== "twilio") {
      missing.push("SMS_PROVIDER");
    }
    for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]) {
      if (!hasRealEnv(key, source)) missing.push(key);
    }
    return missing;
  }

  return def.requiredEnvVars.filter((key) => !hasRealEnv(key, source));
}

function resolveDisabled(
  def: IntegrationProviderDefinition,
  source: EnvSource
): { disabled: boolean; reason?: string } {
  if (def.id === "openai" && source.AI_ENABLED === "false") {
    return { disabled: true, reason: "AI_ENABLED=false" };
  }
  if (def.id === "openai" && source.OPENAI_PAUSED === "1") {
    return { disabled: true, reason: "OPENAI_PAUSED=1" };
  }
  return { disabled: false };
}

export function getIntegrationStatus(
  providerId: string,
  source: EnvSource = process.env
): IntegrationStatus {
  const def = getIntegrationProviderDefinition(providerId);
  const lastCheckedAt = new Date().toISOString();

  if (!def) {
    return {
      provider: providerId,
      displayName: providerId,
      configured: false,
      available: false,
      status: "UNAVAILABLE",
      missingVariables: [],
      lastCheckedAt,
      sanitizedError: "Unknown integration provider",
      capabilities: [],
    };
  }

  const { disabled, reason } = resolveDisabled(def, source);
  if (disabled) {
    return {
      provider: def.id,
      displayName: def.name,
      configured: false,
      available: false,
      status: "DISABLED",
      missingVariables: [],
      lastCheckedAt,
      sanitizedError: reason,
      capabilities: def.capabilities,
    };
  }

  if (def.id === "resend") {
    const resend = getResendOperationalStatus(source);
    return {
      provider: def.id,
      displayName: def.name,
      configured: resend.configured,
      available: resend.available,
      status: resend.status,
      missingVariables: resend.missingVariables,
      lastCheckedAt: resend.lastCheckedAt,
      sanitizedError: resend.sanitizedMessage,
      capabilities: def.capabilities,
    };
  }

  if (def.id === "mercado_pago") {
    const mp = getMercadoPagoSanitizedStatus(source as NodeJS.ProcessEnv);
    const missingVariables = missingForProvider(def, source);
    return {
      provider: def.id,
      displayName: def.name,
      configured: mp.configured,
      available: mp.configured && mp.publicKeyConfigured,
      status: mp.status as IntegrationState,
      missingVariables,
      lastCheckedAt,
      sanitizedError: mp.sanitizedMessage,
      capabilities: def.capabilities,
    };
  }

  const missingVariables = missingForProvider(def, source);
  const checker = PROVIDER_CONFIGURED_CHECKERS[def.id];
  const configured = checker ? checker(source) : missingVariables.length === 0;

  // Phase 1: env-only — configured ⇒ AVAILABLE (live probes entram depois).
  const available = configured;
  const status: IntegrationState = configured ? "AVAILABLE" : "NOT_CONFIGURED";

  return {
    provider: def.id,
    displayName: def.name,
    configured,
    available,
    status,
    missingVariables,
    lastCheckedAt,
    sanitizedError: configured
      ? undefined
      : missingVariables.length
        ? `Missing: ${missingVariables.join(", ")}`
        : undefined,
    capabilities: def.capabilities,
  };
}

export function getAllIntegrationStatuses(source: EnvSource = process.env): IntegrationStatus[] {
  return INTEGRATION_PROVIDER_REGISTRY.map((p) => getIntegrationStatus(p.id, source));
}

export function isIntegrationAvailable(
  providerId: string,
  source: EnvSource = process.env
): boolean {
  return getIntegrationStatus(providerId, source).available;
}

export function requireIntegration(
  providerId: string,
  source: EnvSource = process.env
): IntegrationStatus {
  const status = getIntegrationStatus(providerId, source);
  if (status.available) return status;

  if (status.status === "DISABLED") {
    throw new IntegrationError(
      INTEGRATION_ERROR_CODES.INTEGRATION_DISABLED,
      `Integração ${status.displayName} desabilitada.`,
      { provider: providerId, status: status.status },
      503
    );
  }

  if (status.status === "UNAVAILABLE" && status.sanitizedError === "Unknown integration provider") {
    throw new IntegrationError(
      INTEGRATION_ERROR_CODES.INTEGRATION_UNKNOWN,
      `Provedor de integração desconhecido: ${providerId}`,
      { provider: providerId, status: status.status },
      404
    );
  }

  throw new IntegrationError(
    codeForProvider(providerId),
    `Integração ${status.displayName} não configurada.`,
    {
      provider: providerId,
      missingVariables: status.missingVariables,
      status: status.status,
    },
    503
  );
}

export function getMissingEnvironmentVariables(
  providerId?: string,
  source: EnvSource = process.env
): string[] {
  if (providerId) {
    return getIntegrationStatus(providerId, source).missingVariables;
  }
  const all = new Set<string>();
  for (const status of getAllIntegrationStatuses(source)) {
    for (const key of status.missingVariables) all.add(key);
  }
  return [...all].sort();
}

/** Resumo público — sem secrets, apenas disponibilidade e capabilities. */
export function getPublicIntegrationCapabilities(
  source: EnvSource = process.env
): PublicIntegrationCapability[] {
  return INTEGRATION_PROVIDER_REGISTRY.map((def) => {
    const status = getIntegrationStatus(def.id, source);
    return {
      provider: def.id,
      displayName: def.name,
      category: def.category,
      available: status.available,
      capabilities: def.capabilities,
    };
  });
}
