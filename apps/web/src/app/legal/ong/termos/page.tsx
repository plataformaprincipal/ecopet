import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { ONG_TERMS_SECTIONS, ONG_TERMS_TITLE } from "@/lib/legal/ong-terms-content";

export const metadata: Metadata = {
  title: ONG_TERMS_TITLE,
  description: "Termos de Uso e de Colaboração exclusivos para ONGs e protetores individuais na plataforma EcoPet.",
};

export default function OngLegalTermsPage() {
  return (
    <LegalPageLayout
      title={ONG_TERMS_TITLE}
      updatedAt="17 de junho de 2026"
      sections={ONG_TERMS_SECTIONS}
    />
  );
}
