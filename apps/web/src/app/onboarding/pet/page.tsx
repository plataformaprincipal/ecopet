"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PawPrint } from "lucide-react";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPetPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-ecopet-dark to-ecopet-green p-6">
      <EcoPetLogo className="mb-8" variant="dark" size="lg" showText />
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ecopet-green/10">
            <PawPrint className="h-8 w-8 text-ecopet-green" />
          </div>
          <CardTitle className="mt-4">Cadastre seu primeiro pet</CardTitle>
          <CardDescription>
            Complete o perfil do seu companheiro para desbloquear prontuário, IA e recomendações personalizadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" asChild>
            <Link href="/meu-pet?new=1">Cadastrar pet agora</Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            Fazer isso depois
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
