import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signupUrl } from "@/lib/public-client/nav";

type PublicCTASectionProps = {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function PublicCTASection({
  title,
  description,
  primaryLabel = "Criar conta",
  primaryHref = signupUrl(),
  secondaryLabel = "Entrar",
  secondaryHref = "/login",
}: PublicCTASectionProps) {
  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-zinc-900 px-6 py-10 text-center text-white shadow-sm dark:border-white/10 sm:px-10">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
