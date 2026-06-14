"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeUser } from "@/lib/auth";
import { useTranslation } from "@/providers/i18n-provider";

export function FoundationDashboard({ user }: { user: SafeUser }) {
  const router = useRouter();
  const { t } = useTranslation();
  const roleKey = `dashboard.roles.${user.role}` as const;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>{t("dashboard.greeting", { name: user.name })}</strong>
          </p>
          <p>
            <strong>{t("dashboard.email")}:</strong> {user.email}
          </p>
          <p>
            <strong>{t("dashboard.role")}:</strong> {t(roleKey as "dashboard.roles.CLIENT")}
          </p>
          {user.partnerProfile && (
            <p>
              <strong>{t("nav.partners")}:</strong> {user.partnerProfile.businessName}
            </p>
          )}
          {user.ongProfile && (
            <p>
              <strong>ONG:</strong> {user.ongProfile.ongName}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="default" asChild>
              <Link href="/perfil">{t("dashboard.editProfile")}</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              {t("dashboard.logout")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
