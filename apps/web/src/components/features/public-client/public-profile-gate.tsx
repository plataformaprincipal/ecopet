import Link from "next/link";
import { LogIn, UserPlus, KeyRound, Shield, Heart, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageHeader } from "./public-page-header";
import { PublicCTASection } from "./public-cta-section";

const BENEFITS = [
  {
    icon: Heart,
    title: "Centralize o cuidado do seu pet",
    description: "Perfil, preferências e histórico em um só lugar, com privacidade e controle.",
  },
  {
    icon: Calendar,
    title: "Agenda e serviços",
    description: "Encontre parceiros verificados e organize compromissos do dia a dia.",
  },
  {
    icon: Bell,
    title: "Lembretes e acompanhamento",
    description: "Receba avisos úteis sobre rotina, consultas e cuidados recorrentes.",
  },
  {
    icon: Shield,
    title: "Conta segura",
    description: "Seus dados protegidos conforme as políticas EcoPet e LGPD.",
  },
];

export function PublicProfileGate() {
  return (
    <div className="space-y-10">
      <PublicPageHeader
        title="Sua conta EcoPet"
        description="Crie uma conta gratuita para acessar Meu Pet, pedidos, agenda e personalização completa do ecossistema."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
          >
            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h3 className="mt-3 font-medium text-zinc-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg" className="gap-2">
          <Link href="/login">
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link href="/cadastro">
            <UserPlus className="h-4 w-4" aria-hidden />
            Criar conta
          </Link>
        </Button>
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/recuperar-senha">
            <KeyRound className="h-4 w-4" aria-hidden />
            Recuperar senha
          </Link>
        </Button>
      </div>

      <PublicCTASection
        title="Pronto para começar?"
        description="Cadastre-se em minutos e desbloqueie Meu Pet, marketplace completo e acompanhamento personalizado."
        primaryLabel="Criar conta grátis"
        primaryHref="/cadastro"
        secondaryLabel="Já tenho conta"
        secondaryHref="/login"
      />
    </div>
  );
}
