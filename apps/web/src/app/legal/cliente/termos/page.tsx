import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { CLIENT_TERMS_SECTIONS } from "@/lib/legal/client-terms-content";

export const metadata: Metadata = {
  title: "Termos de Uso e de Serviço do Cliente EccoPet",
  description: "Termos de Uso e de Serviço exclusivos para Clientes da plataforma EccoPet.",
};

export default function ClientLegalTermsPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso e de Serviço do Cliente EccoPet"
      updatedAt="17 de junho de 2026"
      sections={CLIENT_TERMS_SECTIONS}
    />
  );
}
