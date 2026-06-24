import Link from "next/link";
import { Building2, Heart, LogIn, PawPrint, Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCOUNT_TYPES = [
  {
    icon: PawPrint,
    title: "Tutor",
    href: "/cadastro?tipo=cliente",
    benefits: [
      "Cadastrar pets",
      "Comprar produtos",
      "Agendar serviços",
      "Participar da comunidade",
    ],
  },
  {
    icon: Store,
    title: "Parceiro",
    href: "/cadastro?tipo=parceiro",
    benefits: [
      "Vender produtos",
      "Oferecer serviços",
      "Receber pedidos",
      "Acompanhar clientes",
    ],
  },
  {
    icon: Building2,
    title: "ONG",
    href: "/cadastro?tipo=ong",
    benefits: [
      "Divulgar animais",
      "Receber apoio",
      "Publicar campanhas",
      "Organizar adoções",
    ],
  },
];

export function PublicProfilePagePremium() {
  return (
    <div className="space-y-10">
      <header className="rounded-[20px] bg-gradient-to-br from-ecopet-dark to-emerald-900 p-8 text-white sm:p-12">
        <Heart className="h-10 w-10 text-ecopet-yellow" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Seu mundo pet começa aqui.</h1>
        <p className="mt-3 max-w-xl text-white/80">
          Entre na sua conta ou crie uma gratuitamente para desbloquear todo o ecossistema EcoPet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-xl bg-white text-ecopet-dark hover:bg-ecopet-cream">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" aria-hidden />
              Entrar
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/cadastro">
              <UserPlus className="mr-2 h-4 w-4" aria-hidden />
              Criar conta
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {ACCOUNT_TYPES.map(({ icon: Icon, title, href, benefits }) => (
          <article
            key={title}
            className="flex flex-col rounded-[20px] border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10">
              <Icon className="h-6 w-6 text-ecopet-green" aria-hidden />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Criar conta de {title.toLowerCase()}
            </h2>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ecopet-green" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 rounded-xl">
              <Link href={href}>Criar conta de {title.toLowerCase()}</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
