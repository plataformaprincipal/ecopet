"use client";

import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { useSupportChat } from "@/providers/support-chat-provider";

const PHONE = "(83) 99617-5215";
const PHONE_TEL = "+5583996175215";
const WHATSAPP_URL = `https://wa.me/5583996175215`;

const NAV_LINKS = [
  { href: "/inicio", label: "Início" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/social/explorar", label: "Rede Social" },
  { href: "/marketplace/servicos", label: "Serviços" },
  { href: "/agenda", label: "Agendamento" },
  { href: "/meu-pet", label: "Cadastro de Pet" },
  { href: "/perfil", label: "Perfil" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
];

export function EcopetFooter() {
  const { openChat, hasUnread } = useSupportChat();

  return (
    <footer className="border-t border-ecopet-gray/15 bg-[#003B16] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <EcoPetLogo href="/inicio" variant="dark" size="md" showText />
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Ecossistema Inteligente para Pets, ONGs, Protetores, Parceiros e AgroPet.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              Navegação
            </h3>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/75 transition hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              Contato
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li>
                <span className="block text-xs uppercase tracking-wide text-white/50">Telefone</span>
                <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 hover:text-white hover:underline">
                  <Phone className="h-4 w-4 text-ecopet-yellow" />
                  {PHONE}
                </a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wide text-white/50">WhatsApp</span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white hover:underline"
                >
                  <MessageCircle className="h-4 w-4 text-ecopet-yellow" />
                  {PHONE}
                </a>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={openChat}
                  className="inline-flex items-center gap-2 rounded-xl bg-ecopet-yellow px-4 py-2.5 text-sm font-semibold text-ecopet-dark transition hover:bg-ecopet-yellow/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Suporte
                  {hasUnread && (
                    <span className="ml-1 h-2 w-2 rounded-full bg-red-500" aria-label="Nova mensagem" />
                  )}
                </button>
                <p className="mt-2 text-xs text-white/50">Chat interno com histórico e resposta da equipe.</p>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ecopet-yellow">
              ECOPET
            </h3>
            <p className="mt-4 text-sm text-white/70">
              Plataforma completa para tutores, parceiros, ONGs e AgroPet — marketplace, saúde animal, rede social e inteligência integrada.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} ECOPET — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
