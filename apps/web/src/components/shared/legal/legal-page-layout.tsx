import Link from "next/link";
import { EcoPetLogo } from "@/components/shared/brand/ecopet-logo";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export function LegalPageLayout({ title, updatedAt, sections }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ecopet-dark-bg">
      <header className="border-b border-ecopet-gray/10 bg-white px-6 py-6 dark:bg-ecopet-dark-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <EcoPetLogo href="/" variant="light" size="sm" showText />
          <Link href="/" className="text-sm text-ecopet-green hover:underline">
            Voltar ao início
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-ecopet-dark dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-ecopet-gray">Última atualização: {updatedAt}</p>

        <div className="prose prose-ecopet mt-8 max-w-none space-y-8 text-ecopet-dark dark:text-white/90">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-semibold text-ecopet-green">{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-ecopet-gray dark:text-white/75">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ecopet-gray dark:text-white/75">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
