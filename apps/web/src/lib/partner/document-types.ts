import {
  Award,
  BadgeCheck,
  Building2,
  FileCheck,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Landmark,
  ShieldCheck,
  Stethoscope,
  Briefcase,
} from "lucide-react";
import type { PartnerType } from "@/lib/partner/constants";
import {
  DOC_CNPJ_CARD,
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_SOCIAL_CONTRACT,
} from "@/lib/partner/document-validation";

export type DocumentUploadStatus = "pending" | "uploaded" | "validated" | "rejected";

export type PartnerDocumentDefinition = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof FileText;
  required: boolean;
};

const LEGAL_REP: PartnerDocumentDefinition = {
  id: DOC_LEGAL_REP,
  label: "Documento oficial do Responsável Legal",
  hint: "RG, CNH, Carteira Profissional ou documento oficial equivalente",
  icon: IdCard,
  required: true,
};

const RESIDENCE: PartnerDocumentDefinition = {
  id: DOC_RESIDENCE_PROOF,
  label: "Comprovante de Residência",
  hint: "Conta de água, energia, internet, telefone, correspondência bancária ou equivalente",
  icon: Home,
  required: true,
};

const AUTONOMOUS_OPTIONAL: PartnerDocumentDefinition[] = [
  { id: "CPF", label: "CPF", icon: BadgeCheck, required: false },
  { id: "PROFESSIONAL_CERT", label: "Certificados profissionais", icon: Award, required: false },
  { id: "COURSE_CERT", label: "Certificados de cursos", icon: GraduationCap, required: false },
  { id: "PROFESSIONAL_REGISTRY", label: "Registros profissionais", icon: ShieldCheck, required: false },
  { id: "COUNCIL_CARD", label: "Carteira de conselho profissional", icon: Stethoscope, required: false },
  { id: "BUSINESS_LICENSE", label: "Alvará", icon: Landmark, required: false },
  { id: "SANITARY_LICENSE", label: "Licenças", icon: ShieldCheck, required: false },
  { id: "EXPERIENCE_PROOF", label: "Comprovantes de experiência", icon: Briefcase, required: false },
  { id: "OTHER", label: "Outros documentos", icon: FileText, required: false },
];

const CORPORATE_REQUIRED_EXTRA: PartnerDocumentDefinition[] = [
  {
    id: DOC_CNPJ_CARD,
    label: "Cartão CNPJ",
    icon: Building2,
    required: true,
  },
  {
    id: DOC_SOCIAL_CONTRACT,
    label: "Contrato Social",
    icon: FileText,
    required: true,
  },
];

const CORPORATE_OPTIONAL: PartnerDocumentDefinition[] = [
  { id: "MEI_CERT", label: "Certificado MEI", icon: FileCheck, required: false },
  { id: "OPERATING_LICENSE", label: "Alvará de Funcionamento", icon: Landmark, required: false },
  { id: "SANITARY_LICENSE", label: "Licença Sanitária", icon: ShieldCheck, required: false },
  { id: "COUNCIL_REGISTRY", label: "Registro em Conselho Profissional", icon: Stethoscope, required: false },
  { id: "TECH_CERT", label: "Certificados Técnicos", icon: Award, required: false },
  { id: "BUSINESS_ADDRESS", label: "Comprovante de Endereço Empresarial", icon: Home, required: false },
  { id: "OTHER", label: "Outros documentos", icon: FileText, required: false },
];

export function getPartnerDocumentDefinitions(partnerType: PartnerType): {
  required: PartnerDocumentDefinition[];
  optional: PartnerDocumentDefinition[];
} {
  if (partnerType === "CORPORATE") {
    return {
      required: [LEGAL_REP, RESIDENCE, ...CORPORATE_REQUIRED_EXTRA],
      optional: CORPORATE_OPTIONAL,
    };
  }
  return {
    required: [LEGAL_REP, RESIDENCE],
    optional: AUTONOMOUS_OPTIONAL,
  };
}

export const PARTNER_DOCUMENT_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp";

export const PARTNER_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

export const PARTNER_LOGO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/svg+xml,.svg";

export const PARTNER_LOGO_MAX_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentUploadStatus, string> = {
  pending: "Não enviado",
  uploaded: "Enviado",
  validated: "Validado",
  rejected: "Rejeitado",
};
