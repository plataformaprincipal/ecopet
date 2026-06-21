"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientRegisterForm } from "@/components/features/foundation/client-register-form";
import { PartnerRegisterForm } from "@/components/features/foundation/partner/partner-register-form";
import { OngRegisterForm } from "@/components/features/foundation/ong/ong-register-form";
import {
  RegisterRoleSelector,
  REGISTER_ROLE_REQUIRED_MESSAGE,
  type RegisterRole,
} from "@/components/features/foundation/register-role-selector";

export function FoundationRegisterForm() {
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [roleError, setRoleError] = useState("");

  function handleRoleChange(next: RegisterRole) {
    setRole(next);
    setRoleError("");
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader>
        <CardTitle>Criar conta EcoPet</CardTitle>
        <CardDescription>Escolha como deseja usar a plataforma e preencha seus dados.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        <RegisterRoleSelector value={role} onChange={handleRoleChange} error={roleError} />

        {role === "CLIENT" && <ClientRegisterForm embedded />}

        {role === "PARTNER" && <PartnerRegisterForm embedded />}

        {role === "ONG" && <OngRegisterForm embedded />}

        {!role && (
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Selecione uma opção acima para continuar o cadastro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
