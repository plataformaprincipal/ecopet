import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { PARTNER_TERMS_SECTIONS, PARTNER_TERMS_TITLE } from "@/lib/legal/partner-terms-content";

export const metadata: Metadata = {
  title: PARTNER_TERMS_TITLE,
  description: "Termos exclusivos para Parceiros da plataforma EcoPet — independentes dos documentos do Cliente.",
};

export default function PartnerLegalTermsPage() {
  return (
    <LegalPageLayout
      title={PARTNER_TERMS_TITLE}
      updatedAt="21 de junho de 2026"
      sections={PARTNER_TERMS_SECTIONS}
    />
  );
}
