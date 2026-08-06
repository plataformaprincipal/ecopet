/**
 * Feature flags financeiras (env). Sem fallback inseguro que ative em Production Vercel.
 * Preview/local: ligados por padrão (sobrescrevíveis).
 * Production (VERCEL_ENV=production): desligados até override explícito.
 */

function envBool(name: string, defaultValue: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Em Production Vercel, default off; demais ambientes default conforme argumento. */
function prodSafe(name: string, nonProdDefault: boolean): boolean {
  if (isVercelProduction() && process.env[name] === undefined) return false;
  return envBool(name, nonProdDefault);
}

export type FinancialFlags = {
  FINANCIAL_LEDGER_ENABLED: boolean;
  PAYOUTS_ENABLED: boolean;
  MANUAL_PAYOUT_APPROVAL_REQUIRED: boolean;
  RESERVE_ENABLED: boolean;
  CHARGEBACKS_ENABLED: boolean;
  DAILY_RECONCILIATION_ENABLED: boolean;
};

export function getFinancialFlags(): FinancialFlags {
  return {
    FINANCIAL_LEDGER_ENABLED: prodSafe("FINANCIAL_LEDGER_ENABLED", true),
    PAYOUTS_ENABLED: prodSafe("PAYOUTS_ENABLED", true),
    MANUAL_PAYOUT_APPROVAL_REQUIRED: envBool("MANUAL_PAYOUT_APPROVAL_REQUIRED", true),
    RESERVE_ENABLED: prodSafe("RESERVE_ENABLED", true),
    CHARGEBACKS_ENABLED: prodSafe("CHARGEBACKS_ENABLED", true),
    DAILY_RECONCILIATION_ENABLED: envBool("DAILY_RECONCILIATION_ENABLED", false),
  };
}
