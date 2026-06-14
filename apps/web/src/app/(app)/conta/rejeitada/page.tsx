import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RejectedAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountStatus !== "REJECTED") redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Cadastro não aprovado</CardTitle>
          <CardDescription>Sua solicitação de acesso à ECOPET foi rejeitada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {user.accountStatusReason ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-900">
              <strong>Motivo:</strong> {user.accountStatusReason}
            </p>
          ) : (
            <p>Entre em contato com o suporte para mais informações.</p>
          )}
          <Button asChild variant="outline">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
