import {
  Award,
  Building2,
  FileCheck,
  FileText,
  Home,
  IdCard,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";
import type { OngType } from "@/lib/ong/constants";
import {
  DOC_CNPJ_CARD,
  DOC_CPF,
  DOC_LEGAL_REP,
  DOC_RESIDENCE_PROOF,
  DOC_SOCIAL_STATUTE,
} from "@/lib/ong/document-validation";
import type { DocumentUploadStatus } from "@/lib/partner/document-types";
export type { DocumentUploadStatus } from "@/lib/partner/document-types";
export {
  formatFileSize,
  PARTNER_DOCUMENT_ACCEPT as ONG_DOCUMENT_ACCEPT,
  PARTNER_DOCUMENT_MAX_BYTES as ONG_DOCUMENT_MAX_BYTES,
  DOCUMENT_STATUS_LABELS,
} from "@/lib/partner/document-types";

export type OngDocumentDefinition = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof FileText;
  required: boolean;
};

const LEGAL_REP: OngDocumentDefinition = {
  id: DOC_LEGAL_REP,
  label: "Documento oficial com foto",
  hint: "RG, CNH ou documento oficial equivalente",
  icon: IdCard,
  required: true,
};

const RESIDENCE: OngDocumentDefinition = {
  id: DOC_RESIDENCE_PROOF,
  label: "Comprovante de residência",
  icon: Home,
  required: true,
};

const CPF_DOC: OngDocumentDefinition = {
  id: DOC_CPF,
  label: "CPF",
  icon: IdCard,
  required: true,
};

const INDIVIDUAL_OPTIONAL: OngDocumentDefinition[] = [
  { id: "CERTIFICATE", label: "Certificados", icon: Award, required: false },
  { id: "DECLARATION", label: "Declarações", icon: FileCheck, required: false },
  { id: "ACTIVITY_PHOTOS", label: "Fotos das atividades", icon: ImageIcon, required: false },
  { id: "PROOF_OF_WORK", label: "Comprovantes de atuação", icon: ShieldCheck, required: false },
  { id: "OTHER", label: "Outros documentos", icon: FileText, required: false },
];

const INSTITUTION_REQUIRED_EXTRA: OngDocumentDefinition[] = [
  { id: DOC_CNPJ_CARD, label: "Cartão CNPJ", icon: Building2, required: true },
  {
    id: DOC_SOCIAL_STATUTE,
    label: "Estatuto Social ou Ata de Fundação",
    icon: FileText,
    required: true,
  },
];

const INSTITUTION_OPTIONAL: OngDocumentDefinition[] = [
  { id: "OPERATING_LICENSE", label: "Alvarás", icon: ShieldCheck, required: false },
  { id: "CERTIFICATE", label: "Certificados", icon: Award, required: false },
  { id: "LICENSE", label: "Licenças", icon: FileCheck, required: false },
  { id: "REGISTRY", label: "Registros", icon: FileText, required: false },
  { id: "OTHER", label: "Outros documentos", icon: FileText, required: false },
];

export function getOngDocumentDefinitions(ongType: OngType): {
  required: OngDocumentDefinition[];
  optional: OngDocumentDefinition[];
} {
  if (ongType === "INSTITUTION") {
    return {
      required: [LEGAL_REP, RESIDENCE, ...INSTITUTION_REQUIRED_EXTRA],
      optional: INSTITUTION_OPTIONAL,
    };
  }
  return {
    required: [LEGAL_REP, CPF_DOC, RESIDENCE],
    optional: INDIVIDUAL_OPTIONAL,
  };
}
