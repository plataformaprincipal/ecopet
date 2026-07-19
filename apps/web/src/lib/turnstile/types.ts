import type { TurnstileAction } from "./actions";
import type { TurnstileIntegrationStatus } from "./constants";

export type TurnstileEnvironment = "development" | "preview" | "production";

export type TurnstilePublicConfig = {
  siteKey: string;
  enabled: boolean;
  configured: boolean;
};

export type TurnstileServerConfig = {
  siteKey: string;
  secretKey: string;
  enabled: boolean;
  timeoutMs: number;
  allowedHostnames: string[];
  environment: TurnstileEnvironment;
};

export type TurnstileSanitizedStatus = {
  provider: "cloudflare_turnstile";
  configured: boolean;
  enabled: boolean;
  siteKeyConfigured: boolean;
  secretKeyConfigured: boolean;
  environment: TurnstileEnvironment;
  allowedHostnames: string[];
  status: TurnstileIntegrationStatus;
  sanitizedMessage?: string;
};

export type TurnstileVerifyInput = {
  token: string | null | undefined;
  expectedAction: TurnstileAction;
  /** Hostname da requisição (ex.: headers Host / x-forwarded-host). */
  requestHostname?: string | null;
  remoteIp?: string | null;
  flow?: string;
  correlationId?: string;
  userId?: string | null;
};

export type TurnstileErrorCode =
  | "NOT_CONFIGURED"
  | "DISABLED"
  | "TOKEN_MISSING"
  | "TOKEN_INVALID"
  | "TOKEN_MALFORMED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REUSED"
  | "ACTION_MISMATCH"
  | "HOSTNAME_MISMATCH"
  | "CLOUDFLARE_REJECTED"
  | "CLOUDFLARE_UNAVAILABLE"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "BYPASS_FORBIDDEN"
  | "UNEXPECTED";

export type TurnstileVerifyResult = {
  success: boolean;
  code: TurnstileErrorCode | "OK";
  action?: string;
  hostname?: string;
  challengeTimestamp?: Date;
  /** Mensagem sanitizada para logs/admin — nunca token/segredo. */
  sanitizedMessage?: string;
};

export type TurnstileWidgetState =
  | "idle"
  | "loading"
  | "ready"
  | "verified"
  | "expired"
  | "error"
  | "unavailable";
