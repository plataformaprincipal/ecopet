import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendingReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Conta em análise</CardTitle>
          <CardDescription>
            Olá, {user.name}. Sua conta ({user.role}) está aguardando aprovação da equipe ECOPET.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Enquanto isso, você pode completar seu perfil e acompanhar o status. Funcionalidades
            comerciais ou institucionais sensíveis ficam bloqueadas até a aprovação.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={
                user.role === "PARTNER"
                  ? "/dashboard/partner/profile"
                  : user.role === "ONG"
                    ? "/dashboard/ong/profile"
                    : "/perfil"
              }>
                Completar perfil
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={
                user.role === "PARTNER"
                  ? "/dashboard/partner"
                  : user.role === "ONG"
                    ? "/dashboard/ong"
                    : "/dashboard"
              }>
                Voltar ao painel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
