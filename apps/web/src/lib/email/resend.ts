import { Resend } from "resend";
import {
  getEmailFromAddress,
  getResendApiKey as getKeyFromConfig,
  isResendConfigured,
} from "@/lib/email/config";

/** @deprecated Use getEmailFromAddress from config — mantido para compatibilidade. */
export const RESEND_DEFAULT_FROM = "onboarding@resend.dev";

export function getResendApiKey(source: NodeJS.ProcessEnv = process.env): string | undefined {
  return getKeyFromConfig(source);
}

export function getResendFromAddress(source: NodeJS.ProcessEnv = process.env): string {
  return getEmailFromAddress(source);
}

export function isResendReady(source: NodeJS.ProcessEnv = process.env): boolean {
  return isResendConfigured(source);
}

let singleton: Resend | null = null;
let singletonKey: string | undefined;

/**
 * Cliente Resend singleton — inicializa uma vez por processo.
 * Usa exclusivamente process.env.RESEND_API_KEY (via config).
 */
export function getResendClient(source: NodeJS.ProcessEnv = process.env): Resend | null {
  const apiKey = getResendApiKey(source);
  if (!apiKey) {
    singleton = null;
    singletonKey = undefined;
    return null;
  }
  if (singleton && singletonKey === apiKey) {
    return singleton;
  }
  singleton = new Resend(apiKey);
  singletonKey = apiKey;
  return singleton;
}

/** @deprecated Prefer getResendClient(). */
export function createResendClient(source: NodeJS.ProcessEnv = process.env): Resend | null {
  return getResendClient(source);
}

export type ResendSendPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  logPrefix?: string;
};

export type ResendSendResult = {
  sent: boolean;
  id?: string;
  data?: unknown;
  error?: unknown;
  errorCode?: string;
};

/** Reset do singleton — apenas testes. */
export function __resetResendClientForTests(): void {
  singleton = null;
  singletonKey = undefined;
}
