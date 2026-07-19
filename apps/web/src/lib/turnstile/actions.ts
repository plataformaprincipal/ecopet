/**
 * Actions Turnstile permitidas (≤32 chars, [a-z0-9_-]).
 * O backend só aceita valores desta lista — nunca actions arbitrárias do cliente.
 */

export const TURNSTILE_ACTIONS = {
  REGISTER_CLIENT: "register_client",
  REGISTER_PARTNER: "register_partner",
  REGISTER_NGO: "register_ngo",
  PASSWORD_RECOVERY: "password_recovery",
  CONTACT_FORM: "contact_form",
  SUPPORT_TICKET: "support_ticket",
  PUBLIC_REPORT: "public_report",
  LOGIN_RISK: "login_risk",
  PUBLIC_QUOTE: "public_quote",
  COMMENT_RISK: "comment_risk",
  POST_RISK: "post_risk",
  MESSAGE_RISK: "message_risk",
} as const;

export type TurnstileActionKey = keyof typeof TURNSTILE_ACTIONS;
export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[TurnstileActionKey];

const ACTION_SET = new Set<string>(Object.values(TURNSTILE_ACTIONS));

export function isTurnstileAction(value: unknown): value is TurnstileAction {
  return typeof value === "string" && ACTION_SET.has(value);
}

export function getTurnstileExpectedAction(key: TurnstileActionKey): TurnstileAction {
  return TURNSTILE_ACTIONS[key];
}

/** Mapeia role de cadastro → action Turnstile. */
export function registerActionForRole(
  role: "CLIENT" | "PARTNER" | "ONG" | string
): TurnstileAction {
  if (role === "PARTNER") return TURNSTILE_ACTIONS.REGISTER_PARTNER;
  if (role === "ONG") return TURNSTILE_ACTIONS.REGISTER_NGO;
  return TURNSTILE_ACTIONS.REGISTER_CLIENT;
}

export const TURNSTILE_PROTECTED_FLOWS: ReadonlyArray<{
  flow: string;
  action: TurnstileAction;
  mode: "always" | "progressive";
  description: string;
}> = [
  {
    flow: "register_client",
    action: TURNSTILE_ACTIONS.REGISTER_CLIENT,
    mode: "always",
    description: "Cadastro de cliente",
  },
  {
    flow: "register_partner",
    action: TURNSTILE_ACTIONS.REGISTER_PARTNER,
    mode: "always",
    description: "Cadastro de parceiro",
  },
  {
    flow: "register_ngo",
    action: TURNSTILE_ACTIONS.REGISTER_NGO,
    mode: "always",
    description: "Cadastro de ONG",
  },
  {
    flow: "password_recovery",
    action: TURNSTILE_ACTIONS.PASSWORD_RECOVERY,
    mode: "always",
    description: "Recuperação de senha",
  },
  {
    flow: "contact_form",
    action: TURNSTILE_ACTIONS.CONTACT_FORM,
    mode: "always",
    description: "Formulário público de contato",
  },
  {
    flow: "login",
    action: TURNSTILE_ACTIONS.LOGIN_RISK,
    mode: "progressive",
    description: "Login com risco (falhas repetidas)",
  },
];
