/** URLs oficiais VLibras (gov.br) */
export const VLIBRAS_SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
/** Espelho www — fallback quando vlibras.gov.br estiver indisponível */
export const VLIBRAS_SCRIPT_URL_FALLBACK = "https://www.vlibras.gov.br/app/vlibras-plugin.js";
export const VLIBRAS_SCRIPT_URLS = [VLIBRAS_SCRIPT_URL, VLIBRAS_SCRIPT_URL_FALLBACK] as const;
export const VLIBRAS_WIDGET_URL = "https://vlibras.gov.br/app";
/** Timeout por tentativa de script / window.VLibras */
export const VLIBRAS_SCRIPT_TIMEOUT_MS = 8_000;
/** Poll do avatar (.vp-access-button) */
export const VLIBRAS_AVATAR_POLL_MS = 500;
export const VLIBRAS_AVATAR_TIMEOUT_MS = 10_000;
/** Teto global da operação ensureVLibras (UI deve sair de loading dentro desse prazo) */
export const VLIBRAS_TOTAL_LOAD_TIMEOUT_MS = 12_000;
