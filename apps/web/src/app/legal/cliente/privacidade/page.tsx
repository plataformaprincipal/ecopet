import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { CLIENT_PRIVACY_SECTIONS } from "@/lib/legal/client-privacy-content";

export const metadata: Metadata = {
  title: "Política de Privacidade do Cliente EccoPet",
  description: "Política de Privacidade exclusiva para Clientes da plataforma EccoPet.",
};

export default function ClientLegalPrivacyPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade do Cliente EccoPet"
      updatedAt="17 de junho de 2026"
      sections={CLIENT_PRIVACY_SECTIONS}
    />
  );
}
