import Link from "next/link";
import { Calendar, ClipboardList, Heart, PawPrint, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageHeader } from "./public-page-header";
import { PublicCTASection } from "./public-cta-section";
import { signupUrl } from "@/lib/public-client/nav";

const FEATURES = [
  {
    icon: PawPrint,
    title: "Perfil completo do pet",
    description: "Nome, espécie, porte, foto e informações essenciais para personalizar sua experiência.",
  },
  {
    icon: Calendar,
    title: "Agenda integrada",
    description: "Consultas, banho, tosa e outros serviços organizados em um só lugar.",
  },
  {
    icon: ClipboardList,
    title: "Histórico e rotina",
    description: "Registre cuidados, visitas e eventos importantes da vida do seu pet.",
  },
  {
    icon: Syringe,
    title: "Lembretes de cuidados",
    description: "Vacinas, vermífugos e rotinas recorrentes com avisos quando você tiver conta ativa.",
  },
  {
    icon: Heart,
    title: "Experiência personalizada",
    description: "Recomendações de produtos e serviços compatíveis com o perfil do seu pet.",
  },
];

export function PublicMeuPetPreview() {
  return (
    <div className="space-y-10">
      <PublicPageHeader
        title="Meu Pet"
        description="Organize a vida do seu pet em um módulo dedicado. Antes de criar conta, conheça o que você poderá fazer."
        actions={
          <Button asChild size="sm">
            <Link href={signupUrl("/meu-pet")}>Criar perfil do meu pet</Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-100">
        Para cadastrar pets e salvar dados reais, é necessário criar uma conta EcoPet. Nenhum dado
        é armazenado nesta visualização pública.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/60"
          >
            <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h3 className="mt-3 font-medium text-zinc-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
        ))}
      </div>

      <PublicCTASection
        title="Comece pelo perfil do seu pet"
        description="Crie sua conta gratuita e cadastre seu primeiro pet em poucos passos."
        primaryLabel="Criar perfil do meu pet"
        primaryHref={signupUrl("/meu-pet")}
        secondaryLabel="Entrar"
        secondaryHref="/login?callbackUrl=%2Fmeu-pet"
      />
    </div>
  );
}
