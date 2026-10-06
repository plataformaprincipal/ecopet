/**
 * Máquina de onboarding do parceiro — derivada dos campos já persistidos.
 * Sem migration: reutiliza PartnerProfile + PartnerMpConnection.
 */

export const PARTNER_ONBOARDING_STATUSES = [
  "DRAFT",
  "PENDING_DATA",
  "PENDING_DOCUMENTS",
  "PENDING_MERCADO_PAGO",
  "UNDER_REVIEW",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "REJECTED",
] as const;

export type PartnerOnboardingStatus = (typeof PARTNER_ONBOARDING_STATUSES)[number];

export type PartnerOnboardingChecklist = {
  cadastral: boolean;
  commercial: boolean;
  banking: boolean;
  documents: boolean;
  mercadoPago: boolean;
  terms: boolean;
  approved: boolean;
};

export type PartnerOnboardingSnapshot = {
  status: PartnerOnboardingStatus;
  sellable: boolean;
  message: string;
  checklist: PartnerOnboardingChecklist;
  mpStatus: string;
};

type FinancialDetails = {
  pixKey?: string;
  pixKeyType?: string;
  bankName?: string;
  bankCode?: string;
  agency?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: string;
  accountHolder?: string;
  accountHolderDocument?: string;
  paymentMethods?: string[];
};

type PartnerOnboardingInput = {
  accountStatus?: string | null;
  verificationStatus?: string | null;
  approvedAt?: Date | string | null;
  businessName?: string | null;
  legalName?: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
  commercialEmail?: string | null;
  financialDetails?: unknown;
  verificationDocuments?: unknown;
  mpStatus?: string | null;
  mpUserId?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseFinancialDetails(raw: unknown): FinancialDetails {
  const rec = asRecord(raw);
  return {
    pixKey: typeof rec.pixKey === "string" ? rec.pixKey : undefined,
    pixKeyType: typeof rec.pixKeyType === "string" ? rec.pixKeyType : undefined,
    bankName: typeof rec.bankName === "string" ? rec.bankName : undefined,
    bankCode: typeof rec.bankCode === "string" ? rec.bankCode : undefined,
    agency: typeof rec.agency === "string" ? rec.agency : undefined,
    accountNumber: typeof rec.accountNumber === "string" ? rec.accountNumber : undefined,
    accountDigit: typeof rec.accountDigit === "string" ? rec.accountDigit : undefined,
    accountType: typeof rec.accountType === "string" ? rec.accountType : undefined,
    accountHolder: typeof rec.accountHolder === "string" ? rec.accountHolder : undefined,
    accountHolderDocument:
      typeof rec.accountHolderDocument === "string" ? rec.accountHolderDocument : undefined,
    paymentMethods: Array.isArray(rec.paymentMethods)
      ? rec.paymentMethods.filter((v): v is string => typeof v === "string")
      : undefined,
  };
}

export function maskFinancialDetails(raw: unknown): Record<string, string | null> {
  const fin = parseFinancialDetails(raw);
  const maskTail = (value: string | undefined, keep: number) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.length <= keep) return "****";
    return `${"*".repeat(Math.max(4, trimmed.length - keep))}${trimmed.slice(-keep)}`;
  };
  return {
    bankName: fin.bankName ?? null,
    bankCode: fin.bankCode ?? null,
    agency: maskTail(fin.agency, 2),
    accountNumber: maskTail(fin.accountNumber, 4),
    accountDigit: fin.accountDigit ? "*" : null,
    accountType: fin.accountType ?? null,
    accountHolder: fin.accountHolder ?? null,
    pixKeyType: fin.pixKeyType ?? null,
    pixKey: maskTail(fin.pixKey, 3),
    accountHolderDocument: maskTail(fin.accountHolderDocument, 2),
  };
}

export function hasBankingDetails(raw: unknown): boolean {
  const fin = parseFinancialDetails(raw);
  const hasPix = Boolean(fin.pixKey && fin.pixKeyType);
  const hasBank = Boolean(fin.bankName && fin.agency && fin.accountNumber && fin.accountHolder);
  return hasPix || hasBank;
}

export function hasDocuments(raw: unknown): boolean {
  if (Array.isArray(raw)) return raw.length > 0;
  const rec = asRecord(raw);
  if (Array.isArray(rec.items)) return rec.items.length > 0;
  if (Array.isArray(rec.documents)) return rec.documents.length > 0;
  return Object.keys(rec).length > 0;
}

export function isMercadoPagoConnected(mpStatus?: string | null, mpUserId?: string | null): boolean {
  return String(mpStatus ?? "").toUpperCase() === "CONNECTED" && Boolean(mpUserId?.trim());
}

export function evaluatePartnerOnboarding(input: PartnerOnboardingInput): PartnerOnboardingSnapshot {
  const cadastral = Boolean(
    nonEmpty(input.businessName) && nonEmpty(input.legalName) && nonEmpty(input.address) && nonEmpty(input.city)
  );
  const commercial = Boolean(nonEmpty(input.category) && (nonEmpty(input.description) || nonEmpty(input.commercialEmail)));
  const banking = hasBankingDetails(input.financialDetails);
  const documents = hasDocuments(input.verificationDocuments);
  const mercadoPago = isMercadoPagoConnected(input.mpStatus, input.mpUserId);
  const approved =
    input.accountStatus === "ACTIVE" &&
    input.verificationStatus === "APPROVED" &&
    input.approvedAt != null;
  const terms = cadastral;

  const checklist: PartnerOnboardingChecklist = {
    cadastral,
    commercial,
    banking,
    documents,
    mercadoPago,
    terms,
    approved,
  };

  let status: PartnerOnboardingStatus = "DRAFT";
  if (input.accountStatus === "SUSPENDED") status = "SUSPENDED";
  else if (input.accountStatus === "REJECTED" || input.verificationStatus === "REJECTED") status = "REJECTED";
  else if (approved && mercadoPago) status = "ACTIVE";
  else if (approved && !mercadoPago) status = "PENDING_MERCADO_PAGO";
  else if (cadastral && commercial && banking && documents && mercadoPago) status = "UNDER_REVIEW";
  else if (cadastral && commercial && banking && documents) status = "PENDING_MERCADO_PAGO";
  else if (cadastral && commercial && banking) status = "PENDING_DOCUMENTS";
  else if (cadastral) status = "PENDING_DATA";
  else status = "DRAFT";

  const sellable = status === "ACTIVE" && checklist.approved && checklist.mercadoPago;
  const message = sellable
    ? "Conta habilitada para vender."
    : "Finalize sua conta para começar a vender.";

  return {
    status,
    sellable,
    message,
    checklist,
    mpStatus: input.mpStatus ?? "NOT_CONNECTED",
  };
}

export const SELLER_NOT_ENABLED_MESSAGE =
  "Este parceiro ainda não está habilitado para receber pagamentos. Escolha outro vendedor ou tente novamente mais tarde.";
