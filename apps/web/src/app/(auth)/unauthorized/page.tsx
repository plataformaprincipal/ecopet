import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Acesso não autorizado</CardTitle>
        <CardDescription>
          Você não tem permissão para acessar esta área. Entre com uma conta com o perfil adequado ou
          volte ao seu painel.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button asChild className="w-full rounded-2xl">
          <Link href="/login">Fazer login</Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-2xl">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
