import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/shared/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "LGPD — Direitos do Titular",
  description: "Como exercer seus direitos na ECOPET conforme a LGPD.",
};

const SECTIONS = [
  {
    title: "1. Seus direitos",
    paragraphs: ["Acesso, correção, portabilidade, exclusão, revogação de consentimento e informação sobre compartilhamento."],
  },
  {
    title: "2. Como solicitar",
    paragraphs: [
      "Usuários autenticados podem usar as APIs: GET /api/account/export-data, POST /api/account/request-deletion, POST /api/account/revoke-consent.",
      "Todas as solicitações geram registro auditável e são analisadas pela equipe administrativa.",
    ],
  },
  {
    title: "3. Prazos",
    paragraphs: ["Responderemos em até 15 dias úteis, conforme art. 18 da LGPD."],
  },
  {
    title: "4. Exclusão de conta",
    paragraphs: [
      "A exclusão completa pode ser limitada por obrigações legais (pedidos, auditoria, prevenção a fraude).",
      "Consulte também /legal/exclusao-de-conta.",
    ],
  },
];

export default function LegalLgpdPage() {
  return (
    <>
      <LegalPageLayout title="LGPD — Direitos do Titular" updatedAt="15 de junho de 2026" sections={SECTIONS} />
      <div className="mx-auto max-w-3xl px-6 pb-10 text-sm">
        <Link href="/legal/exclusao-de-conta" className="text-ecopet-green underline">
          Solicitar exclusão de conta
        </Link>
      </div>
    </>
  );
}
