import type { OngType } from "@/lib/ong/constants";

export const DOC_LEGAL_REP = "LEGAL_REP_ID";
export const DOC_CPF = "CPF_DOC";
export const DOC_RESIDENCE_PROOF = "RESIDENCE_PROOF";
export const DOC_CNPJ_CARD = "CNPJ_CARD";
export const DOC_SOCIAL_STATUTE = "SOCIAL_STATUTE";

export const INDIVIDUAL_REQUIRED_DOCS = [DOC_LEGAL_REP, DOC_CPF, DOC_RESIDENCE_PROOF] as const;

export const INSTITUTION_REQUIRED_DOCS = [
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_CNPJ_CARD,
  DOC_SOCIAL_STATUTE,
] as const;

export const ONG_DOCS_MISSING_MESSAGE =
  "Envie os documentos obrigatórios para continuar.";

export function getRequiredOngDocumentTypes(ongType: OngType): readonly string[] {
  return ongType === "INSTITUTION" ? INSTITUTION_REQUIRED_DOCS : INDIVIDUAL_REQUIRED_DOCS;
}

export function validateRequiredOngDocuments(
  ongType: OngType,
  providedTypes: string[]
): { valid: boolean; message?: string; missing?: string[] } {
  const required = getRequiredOngDocumentTypes(ongType);
  const set = new Set(providedTypes);
  const missing = required.filter((t) => !set.has(t));

  if (!missing.length) return { valid: true };

  return {
    valid: false,
    missing,
    message: ONG_DOCS_MISSING_MESSAGE,
  };
}
