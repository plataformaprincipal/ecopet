/**
 * Módulos de domínio EcoPet.
 * Lógica de negócio permanece em lib/; este índice documenta os domínios ativos.
 */
export const ECOPET_MODULES = [
  "auth",
  "profile",
  "marketplace",
  "social",
  "pets",
  "agro",
  "gestor",
  "notifications",
  "integrations",
  "iot",
  "health",
  "agenda",
] as const;

export type EcopetModule = (typeof ECOPET_MODULES)[number];
