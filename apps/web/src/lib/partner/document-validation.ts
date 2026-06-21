import type { PartnerType } from "@/lib/partner/constants";

/** Documento oficial do responsável legal (RG, CNH, carteira profissional, etc.) */
export const DOC_LEGAL_REP = "LEGAL_REP_ID";

/** Comprovante de residência */
export const DOC_RESIDENCE_PROOF = "RESIDENCE_PROOF";

export const DOC_CNPJ_CARD = "CNPJ_CARD";
export const DOC_SOCIAL_CONTRACT = "SOCIAL_CONTRACT";

export const AUTONOMOUS_REQUIRED_DOCS = [DOC_LEGAL_REP, DOC_RESIDENCE_PROOF] as const;

export const CORPORATE_REQUIRED_DOCS = [
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_CNPJ_CARD,
  DOC_SOCIAL_CONTRACT,
] as const;

export const AUTONOMOUS_DOCS_MISSING_MESSAGE =
  "Envie o documento do responsável legal e o comprovante de residência.";

export const CORPORATE_DOCS_MISSING_MESSAGE =
  "Envie todos os documentos obrigatórios para concluir o cadastro.";

export function getRequiredDocumentTypes(partnerType: PartnerType): readonly string[] {
  return partnerType === "CORPORATE" ? CORPORATE_REQUIRED_DOCS : AUTONOMOUS_REQUIRED_DOCS;
}

export function validateRequiredDocuments(
  partnerType: PartnerType,
  providedTypes: string[]
): { valid: boolean; message?: string; missing?: string[] } {
  const required = getRequiredDocumentTypes(partnerType);
  const set = new Set(providedTypes);
  const missing = required.filter((t) => !set.has(t));

  if (!missing.length) return { valid: true };

  return {
    valid: false,
    missing,
    message:
      partnerType === "CORPORATE"
        ? CORPORATE_DOCS_MISSING_MESSAGE
        : AUTONOMOUS_DOCS_MISSING_MESSAGE,
  };
}
