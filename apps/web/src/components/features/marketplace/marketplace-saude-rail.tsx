import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketplaceSaudeRail() {
  return (
    <section className="space-y-4" data-testid="marketplace-saude-rail">
      <h2 className="text-xl font-semibold tracking-tight">SAÚDE ECCOPET</h2>
      <p className="text-sm text-[var(--ep-fg-muted)]">Serviços comercializados pela EccoPet — separados dos especialistas de IA.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">EccoPet Saúde</p>
          <h3 className="mt-2 text-2xl font-semibold">PLANO DE SAÚDE PET</h3>
          <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">Prevenção e acompanhamento. Não é seguro. Preços do motor oficial.</p>
          <Button asChild className="mt-4">
            <Link href="/marketplace/saude/planos">Conhecer planos</Link>
          </Button>
        </article>
        <article className="rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ecopet-green">Teleconsulta</p>
          <h3 className="mt-2 text-2xl font-semibold">TELECONSULTA E LAUDOS</h3>
          <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">Agendamento, pagamento, prontuário e documento com CRMV.</p>
          <Button asChild className="mt-4">
            <Link href="/marketplace/saude/teleconsulta">Abrir teleconsulta</Link>
          </Button>
        </article>
        <article className="rounded-[20px] border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Emergência</p>
          <h3 className="mt-2 text-2xl font-semibold">EMERGÊNCIA VETERINÁRIA</h3>
          <p className="mt-2 text-sm">Triagem imediata com a Bubis e busca de atendimento veterinário real.</p>
          <Button asChild className="mt-4 bg-red-600 hover:bg-red-700">
            <Link href="/marketplace/emergencia">Preciso de ajuda agora</Link>
          </Button>
        </article>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/marketplace/saude/exames?group=consultas", label: "Consulta" },
          { href: "/marketplace/servicos?group=health&category=vacinacao", label: "Vacinação" },
          { href: "/marketplace/servicos?group=health&category=veterinario", label: "Check-up" },
          { href: "/marketplace/servicos?group=health&category=consultoria", label: "Nutrição" },
          { href: "/marketplace/saude/exames?group=exames", label: "Exames" },
          { href: "/marketplace/saude/exames?group=laudos", label: "Laudos" },
          { href: "/marketplace/saude/teleconsulta", label: "Teleatendimento" },
          { href: "/marketplace/seguro", label: "Seguro" },
          { href: "/marketplace/entretenimento", label: "Entretenimento" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full border border-[var(--ep-border)] px-4 py-2 text-sm"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
