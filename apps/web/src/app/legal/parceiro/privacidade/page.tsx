import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { PARTNER_PRIVACY_SECTIONS, PARTNER_PRIVACY_TITLE } from "@/lib/legal/partner-privacy-content";

export const metadata: Metadata = {
  title: PARTNER_PRIVACY_TITLE,
  description: "Política de Privacidade exclusiva para Parceiros da plataforma EcoPet — independente da política do Cliente.",
};

export default function PartnerLegalPrivacyPage() {
  return (
    <LegalPageLayout
      title={PARTNER_PRIVACY_TITLE}
      updatedAt="21 de junho de 2026"
      sections={PARTNER_PRIVACY_SECTIONS}
    />
  );
}
