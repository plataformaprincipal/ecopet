import type { TranslateFn } from "@/lib/i18n";

type EnumGroup = "orderStatus" | "appointmentStatus" | "generic";

/**
 * Traduz um enum/status do backend para o idioma atual.
 * Nunca exibe o enum cru: cai para o próprio valor caso a chave não exista.
 */
export function translateEnum(t: TranslateFn, group: EnumGroup, value?: string | null): string {
  if (!value) return "";
  const key = `enums.${group}.${value}`;
  const out = t(key);
  return out === key ? value : out;
}

export const translateOrderStatus = (t: TranslateFn, value?: string | null) =>
  translateEnum(t, "orderStatus", value);

export const translateAppointmentStatus = (t: TranslateFn, value?: string | null) =>
  translateEnum(t, "appointmentStatus", value);
