"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { PartnerEmptyState } from "./partner-empty-state";

export function PartnerLockedScreen() {
  return (
    <PartnerEmptyState
      icon={Lock}
      title="Recurso disponível após aprovação"
      description="Complete seu cadastro e aguarde a análise da equipe EcoPet para acessar esta área."
      actionLabel="Ir para Perfil e Gestão"
      actionHref="/parceiro/perfil-gestao"
    />
  );
}
