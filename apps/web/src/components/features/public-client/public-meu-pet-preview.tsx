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
    <div className="space-y-10 animate-fade-in">
      <PublicPageHeader
        title="Meu Pet"
        description="Organize a vida do seu pet em um módulo dedicado. Antes de criar conta, conheça o que você poderá fazer."
        actions={
          <Button asChild size="sm" className="rounded-[var(--radius-button)]">
            <Link href={signupUrl("/meu-pet")}>Criar perfil do meu pet</Link>
          </Button>
        }
      />

      <div className="rounded-[var(--radius-lg)] border border-dashed border-ecopet-green/30 bg-ecopet-green/[0.06] p-4 text-sm text-ecopet-green-800 dark:border-ecopet-green/25 dark:bg-ecopet-green/10 dark:text-ecopet-cream">
        Para cadastrar pets e salvar dados reais, é necessário criar uma conta EcoPet. Nenhum dado
        é armazenado nesta visualização pública.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[var(--radius-xl)] border border-ecopet-gray/12 bg-white p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] dark:border-white/10 dark:bg-ecopet-dark-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-ecopet-green/10">
              <Icon className="h-5 w-5 text-ecopet-green" strokeWidth={2} aria-hidden />
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-ecopet-dark dark:text-white">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ecopet-gray dark:text-white/70">
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
