import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { ONG_PRIVACY_SECTIONS, ONG_PRIVACY_TITLE } from "@/lib/legal/ong-privacy-content";

export const metadata: Metadata = {
  title: ONG_PRIVACY_TITLE,
  description: "Política de Privacidade exclusiva para ONGs e protetores individuais na EcoPet.",
};

export default function OngLegalPrivacyPage() {
  return (
    <LegalPageLayout
      title={ONG_PRIVACY_TITLE}
      updatedAt="17 de junho de 2026"
      sections={ONG_PRIVACY_SECTIONS}
    />
  );
}
