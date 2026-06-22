import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signupUrl } from "@/lib/public-client/nav";

type PublicHeroProps = {
  title: string;
  subtitle: string;
  badge?: string;
};

export function PublicHero({ title, subtitle, badge }: PublicHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 p-8 shadow-sm dark:border-white/10 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-950 sm:p-10">
      {badge ? (
        <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {badge}
        </span>
      ) : null}
      <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
        {subtitle}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={signupUrl()}>Criar conta</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/explorar">
            Explorar EcoPet
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
