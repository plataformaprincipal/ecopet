import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuspendedAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountStatus !== "SUSPENDED") redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Conta suspensa</CardTitle>
          <CardDescription>O acesso à sua conta foi temporariamente bloqueado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Se você acredita que isso é um engano, entre em contato com o suporte ECOPET pelo canal
            oficial de atendimento.
          </p>
          <Button asChild variant="outline">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
