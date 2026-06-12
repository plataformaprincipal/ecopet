import type { TranslationKey } from "./types";

/** Chaves críticas para UX inicial — prefetch idle apenas destas, nunca lote completo */
export const PRIORITY_TRANSLATION_KEYS: TranslationKey[] = [
  "a11y.title",
  "a11y.open",
  "a11y.close",
  "a11y.skipLink",
  "a11y.sections.visual",
  "a11y.sections.languages",
  "nav.home",
  "nav.feed",
  "nav.marketplace",
  "nav.settings",
  "common.search",
  "common.loading",
  "common.signIn",
  "common.createAccount",
  "common.viewMarketplace",
  "auth.login.title",
  "auth.login.submit",
  "lang.selector.label",
];

/** Máximo de prefetches batch por sessão (evita custo excessivo) */
export const MAX_PREFETCH_PER_SESSION = 2;
