import Link from "next/link";
import {
  Calendar,
  Heart,
  ShoppingBag,
  Stethoscope,
  Store,
  Users,
} from "lucide-react";
import { PublicHero } from "../public-hero";
import { PublicCTASection } from "../public-cta-section";

const BENEFITS = [
  {
    icon: Heart,
    title: "Cuidar do seu pet",
    description: "Organize perfil, rotina e informações essenciais em um ecossistema pensado para tutores.",
    href: "/meu-pet",
  },
  {
    icon: Store,
    title: "Encontrar serviços",
    description: "Pet shops, banho e tosa, veterinários e prestadores verificados perto de você.",
    href: "/explorar",
  },
  {
    icon: ShoppingBag,
    title: "Comprar produtos",
    description: "Catálogo com itens de parceiros aprovados e curadoria da plataforma EcoPet.",
    href: "/marketplace",
  },
  {
    icon: Calendar,
    title: "Acompanhar agenda",
    description: "Agende e gerencie compromissos do seu pet com parceiros da rede EcoPet.",
    href: "/cadastro",
  },
  {
    icon: Stethoscope,
    title: "Histórico de cuidados",
    description: "Centralize registros e lembretes de rotina quando sua conta estiver ativa.",
    href: "/meu-pet",
  },
  {
    icon: Users,
    title: "Ecossistema conectado",
    description: "Clientes, parceiros e ONGs em uma plataforma única para o universo pet.",
    href: "/explorar",
  },
];

const DIFFERENTIALS = [
  {
    title: "Parceiros verificados",
    description: "Produtos e serviços de lojas e prestadores com aprovação comercial na plataforma.",
  },
  {
    title: "Experiência unificada",
    description: "Do descobrimento à compra e ao agendamento, tudo integrado em um só lugar.",
  },
  {
    title: "Privacidade em primeiro lugar",
    description: "Seus dados e os do seu pet protegidos conforme LGPD e políticas EcoPet.",
  },
];

export function PublicHomePage() {
  return (
    <div className="space-y-12">
      <PublicHero
        badge="Ecossistema pet"
        title="Tudo o que seu pet precisa, em um só lugar"
        subtitle="EcoPet conecta tutores, parceiros e ONGs em uma plataforma premium para cuidar, comprar, agendar e acompanhar a rotina do seu pet."
      />

      <section aria-labelledby="beneficios-heading">
        <h2 id="beneficios-heading" className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
          O que você encontra no EcoPet
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white dark:text-emerald-400">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-medium text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="diferenciais-heading">
        <h2 id="diferenciais-heading" className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
          Por que escolher o EcoPet
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {DIFFERENTIALS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/80 p-6 dark:border-white/10 dark:from-zinc-900/60 dark:to-zinc-950"
            >
              <h3 className="font-medium text-zinc-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <PublicCTASection
        title="Pronto para entrar no ecossistema?"
        description="Explore gratuitamente ou crie sua conta para desbloquear Meu Pet, pedidos e agenda completa."
        primaryLabel="Criar conta"
        primaryHref="/cadastro"
        secondaryLabel="Explorar sem cadastro"
        secondaryHref="/explorar"
      />
    </div>
  );
}
