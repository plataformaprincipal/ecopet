"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LoginRequiredProps {
  title?: string;
  description?: string;
  feature?: string;
}

export function LoginRequired({
  title = "Login necessário",
  description = "Entre na sua conta ou crie um cadastro para continuar.",
  feature,
}: LoginRequiredProps) {
  const pathname = usePathname();
  const callback = encodeURIComponent(pathname);

  return (
    <Card className="card-premium mx-auto max-w-md border-ecopet-green/20">
      <CardContent className="flex flex-col items-center p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ecopet-green/10">
          <Lock className="h-7 w-7 text-ecopet-green" />
        </div>
        <h2 className="font-display text-xl font-bold text-ecopet-dark dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-ecopet-gray">
          {feature ? `${feature} é exclusivo para usuários cadastrados.` : description}
        </p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="flex-1 sm:flex-none">
            <Link href={`/login?callbackUrl=${callback}`}>Entrar</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/cadastro">Criar Conta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
