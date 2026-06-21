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

export function FoundationRegisterForm() {
  const { t } = useAuthMessages();
  const [role, setRole] = useState<RegisterRole | null>(null);

  function handleRoleChange(next: RegisterRole) {
    setRole(next);
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader>
        <CardTitle>{t("auth.registerFoundation.title")}</CardTitle>
        <CardDescription>{t("auth.registerFoundation.description")}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        <RegisterRoleSelector value={role} onChange={handleRoleChange} />

        {role === "CLIENT" && <ClientRegisterForm embedded />}

        {role === "PARTNER" && <PartnerRegisterForm embedded />}

        {role === "ONG" && <OngRegisterForm embedded />}

        {!role && (
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            {t("auth.registerFoundation.selectRoleHint")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
