/**
 * Status operacional Resend para o painel admin.
 * Não bloqueia build se o domínio ainda não estiver verificado.
 */

import {
  getEmailFromRaw,
  getResendApiKey,
  isEmailDomainVerified,
  isResendSandboxFrom,
} from "@/lib/email/config";

export type ResendOperationalStatus =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "DOMAIN_PENDING"
  | "ACTIVE"
  | "ERROR";

export type ResendStatusSnapshot = {
  provider: "resend";
  status: ResendOperationalStatus;
  configured: boolean;
  available: boolean;
  fromAddress: string;
  domainVerified: boolean;
  usingSandbox: boolean;
  missingVariables: string[];
  sanitizedMessage?: string;
  lastCheckedAt: string;
};

/** Último erro sanitizado (processo) — nunca contém a API key. */
let lastSanitizedError: string | undefined;

export function recordResendOperationalError(message: string | undefined): void {
  lastSanitizedError = message?.slice(0, 280);
}

export function clearResendOperationalError(): void {
  lastSanitizedError = undefined;
}

export function getResendOperationalStatus(
  source: NodeJS.ProcessEnv = process.env
): ResendStatusSnapshot {
  const lastCheckedAt = new Date().toISOString();
  const key = getResendApiKey(source);
  const fromAddress = getEmailFromRaw(source);
  const usingSandbox = isResendSandboxFrom(fromAddress);
  const domainVerified = isEmailDomainVerified(source);
  const missingVariables: string[] = [];

  if (!key) missingVariables.push("RESEND_API_KEY");

  if (!key) {
    return {
      provider: "resend",
      status: "NOT_CONFIGURED",
      configured: false,
      available: false,
      fromAddress,
      domainVerified: false,
      usingSandbox,
      missingVariables,
      sanitizedMessage: "RESEND_API_KEY ausente.",
      lastCheckedAt,
    };
  }

  if (lastSanitizedError) {
    return {
      provider: "resend",
      status: "ERROR",
      configured: true,
      available: false,
      fromAddress,
      domainVerified,
      usingSandbox,
      missingVariables: [],
      sanitizedMessage: lastSanitizedError,
      lastCheckedAt,
    };
  }

  if (usingSandbox || !domainVerified) {
    return {
      provider: "resend",
      status: "DOMAIN_PENDING",
      configured: true,
      /** Sandbox ainda permite envio de testes — disponível com limitações. */
      available: true,
      fromAddress,
      domainVerified: false,
      usingSandbox,
      missingVariables: domainVerified ? [] : usingSandbox ? [] : ["EMAIL_DOMAIN_VERIFIED"],
      sanitizedMessage: usingSandbox
        ? "Usando remetente sandbox Resend (onboarding@resend.dev). Configure domínio eccopet.com."
        : "Domínio customizado pendente de verificação DNS no Resend.",
      lastCheckedAt,
    };
  }

  return {
    provider: "resend",
    status: "ACTIVE",
    configured: true,
    available: true,
    fromAddress,
    domainVerified: true,
    usingSandbox: false,
    missingVariables: [],
    lastCheckedAt,
  };
}
