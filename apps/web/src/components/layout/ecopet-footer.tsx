import Link from "next/link";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";

const RESOURCES = [
  "Rede Social",
  "Marketplace",
  "Adoção",
  "ONGs",
  "Saúde Animal",
  "Serviços",
  "Inteligência Artificial",
];

export function EcopetFooter() {
  return (
    <footer className="border-t border-ecopet-gray/15 bg-[#003B16] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <EcoPetLogo href="/" variant="dark" size="md" showText />
            <p className="mt-4 text-sm text-white/70">
              Plataforma Inteligente para Pets e AgroPets.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              Recursos
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {RESOURCES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              Links
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/termos-de-uso" className="text-white/75 hover:text-white hover:underline">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidade" className="text-white/75 hover:text-white hover:underline">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <a href="mailto:contato@ecopet.com.br" className="text-white/75 hover:text-white hover:underline">
                  Contato
                </a>
              </li>
              <li>
                <a href="mailto:suporte@ecopet.com.br" className="text-white/75 hover:text-white hover:underline">
                  Suporte
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              Contato
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ecopet-yellow" />
                <a href="mailto:contato@ecopet.com.br" className="hover:text-white hover:underline">
                  contato@ecopet.com.br
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-ecopet-yellow" />
                <a href="mailto:suporte@ecopet.com.br" className="hover:text-white hover:underline">
                  suporte@ecopet.com.br
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-4">
              <a
                href="https://instagram.com/ecopet"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram ECOPET"
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/ecopet"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook ECOPET"
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/ecopet"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn ECOPET"
                className="rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © ECOPET — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
