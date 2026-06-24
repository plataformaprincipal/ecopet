"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientRegisterForm } from "@/components/features/foundation/client-register-form";
import { PartnerRegisterForm } from "@/components/features/foundation/partner/partner-register-form";
import { OngRegisterForm } from "@/components/features/foundation/ong/ong-register-form";
import {
  RegisterRoleSelector,
  type RegisterRole,
} from "@/components/features/foundation/register-role-selector";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

type FoundationRegisterFormProps = {
  initialRole?: RegisterRole | null;
  embedded?: boolean;
};

export function FoundationRegisterForm({ initialRole = null, embedded = false }: FoundationRegisterFormProps) {
  const { t } = useAuthMessages();
  const [role, setRole] = useState<RegisterRole | null>(initialRole);

  function handleRoleChange(next: RegisterRole) {
    setRole(next);
  }

  const inner = (
    <>
      {!initialRole && <RegisterRoleSelector value={role} onChange={handleRoleChange} />}

      {role === "CLIENT" && <ClientRegisterForm embedded />}

      {role === "PARTNER" && <PartnerRegisterForm embedded />}

      {role === "ONG" && <OngRegisterForm embedded />}

      {!role && (
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          {t("auth.registerFoundation.selectRoleHint")}
        </p>
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0 space-y-6">{inner}</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader>
        <CardTitle>{t("auth.registerFoundation.title")}</CardTitle>
        <CardDescription>{t("auth.registerFoundation.description")}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">{inner}</CardContent>
    </Card>
  );
}
