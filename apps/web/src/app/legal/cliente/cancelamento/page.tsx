import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";
import { CLIENT_COMMERCE_POLICY_SECTIONS } from "@/lib/legal/commerce-policies-content";

const page = CLIENT_COMMERCE_POLICY_SECTIONS.cancelamento;

export const metadata: Metadata = {
  title: page.title,
  description: "Política de cancelamento da EccoPet.",
};

export default function CancelamentoPage() {
  return <LegalPageLayout title={page.title} updatedAt={page.updatedAt} sections={page.sections} />;
}
