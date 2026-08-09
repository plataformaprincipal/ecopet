/**
 * Extração explícita dos query params de webhooks Mercado Pago.
 * Docs Orders: a assinatura usa o query param `data.id` (não o body).
 */

export type MercadoPagoWebhookQueryExtract = {
  rawQueryKeys: string[];
  /** Valor bruto de `data.id` (sem normalização de case). */
  queryDataDotId: string | null;
  /** Valor bruto de `data_id` (variante PHP/docs legadas). */
  queryDataUnderscoreId: string | null;
  /** Valor bruto de `id` solto, se existir. */
  queryId: string | null;
  typeQuery: string | null;
  /** Preferência oficial: data.id → data_id (nunca inventa valor). */
  preferredQueryDataId: string | null;
};

function firstParam(url: URL, key: string): string | null {
  const v = url.searchParams.get(key);
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

/**
 * Lê query da URL do request. Não altera case; só trim.
 * Inclui fallback regex se `data.id` não aparecer em searchParams
 * (alguns proxies preservam só na query string bruta).
 */
export function extractMercadoPagoWebhookQuery(requestUrl: string): MercadoPagoWebhookQueryExtract {
  let rawQueryKeys: string[] = [];
  let queryDataDotId: string | null = null;
  let queryDataUnderscoreId: string | null = null;
  let queryId: string | null = null;
  let typeQuery: string | null = null;

  try {
    const url = new URL(requestUrl);
    rawQueryKeys = Array.from(url.searchParams.keys());
    queryDataDotId = firstParam(url, "data.id");
    queryDataUnderscoreId = firstParam(url, "data_id");
    queryId = firstParam(url, "id");
    typeQuery = firstParam(url, "type") ?? firstParam(url, "topic");

    if (!queryDataDotId) {
      const m = requestUrl.match(/[?&]data(?:\.|%2[eE])id=([^&]+)/i);
      if (m?.[1]) {
        try {
          queryDataDotId = decodeURIComponent(m[1]).trim() || null;
        } catch {
          queryDataDotId = m[1].trim() || null;
        }
        if (queryDataDotId && !rawQueryKeys.includes("data.id")) {
          rawQueryKeys = [...rawQueryKeys, "data.id"];
        }
      }
    }
  } catch {
    /* keep nulls */
  }

  const preferredQueryDataId = queryDataDotId || queryDataUnderscoreId || null;

  return {
    rawQueryKeys,
    queryDataDotId,
    queryDataUnderscoreId,
    queryId,
    typeQuery,
    preferredQueryDataId,
  };
}

/** Sanitiza id para log/DB — nunca o valor completo se longo. */
export function sanitizeIdForDiag(id: string | null | undefined, max = 12): string | null {
  if (id == null || id === "") return null;
  const s = String(id);
  if (s.length <= max) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
