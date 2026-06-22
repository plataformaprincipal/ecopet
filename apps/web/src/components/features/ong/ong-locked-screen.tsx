"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { OngAccessLevel } from "@/lib/ong/access";
import { OngEmptyState } from "./ong-empty-state";

type OngLockedScreenProps = {
  accessLevel: OngAccessLevel;
};

export function OngLockedScreen({ accessLevel }: OngLockedScreenProps) {
  const description =
    accessLevel === "blocked"
      ? "Sua conta está suspensa ou foi recusada. Acesse Perfil e Gestão para mais informações."
      : "Complete seu cadastro e aguarde a análise da equipe EcoPet para acessar esta área.";

  return (
    <OngEmptyState
      icon={Lock}
      title="Recurso indisponível"
      description={description}
      actionLabel="Ir para Perfil e Gestão"
      actionHref="/ong/perfil-gestao"
    />
  );
}
