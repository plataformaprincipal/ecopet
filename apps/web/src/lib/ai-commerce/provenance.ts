export const DATA_PROVENANCE = [
  "USER_REPORTED",
  "AI_EXTRACTED",
  "DOCUMENT_REPORTED",
  "VETERINARY_RECORDED",
  "SYSTEM_CALCULATED",
  "AI_INFERENCE",
] as const;

export type DataProvenance = (typeof DATA_PROVENANCE)[number];

export const DIAGNOSTIC_STATUS = {
  AI_IMPRESSION: "AI_DIAGNOSTIC_IMPRESSION",
  VET_CONFIRMED: "VETERINARY_CONFIRMED_DIAGNOSIS",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type DiagnosticStatus = (typeof DIAGNOSTIC_STATUS)[keyof typeof DIAGNOSTIC_STATUS];

export const CONFIDENCE_LEVELS = ["HIGH", "MODERATE", "LOW", "INSUFFICIENT_DATA"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  HIGH: "Confiança alta",
  MODERATE: "Confiança moderada",
  LOW: "Confiança baixa",
  INSUFFICIENT_DATA: "Dados insuficientes",
};

export function isClinicalFactProvenance(source: string): boolean {
  return source === "USER_REPORTED" || source === "DOCUMENT_REPORTED" || source === "VETERINARY_RECORDED" || source === "SYSTEM_CALCULATED";
}
