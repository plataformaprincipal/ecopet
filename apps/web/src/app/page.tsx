"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles, ShoppingBag, Heart, Stethoscope, Users, Shield, ArrowRight, ChevronDown, Star,
} from "lucide-react";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AI_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "12k+", label: "Tutores ativos" },
  { value: "850+", label: "Parceiros verificados" },
  { value: "98%", label: "Satisfação" },
  { value: "24/7", label: "IA disponível" },
];

const FEATURES = [
  { icon: Users, title: "Rede Social Pet", desc: "Feed, stories e comunidade com curadoria premium.", href: "/cadastro" },
  { icon: ShoppingBag, title: "Marketplace", desc: "Produtos e serviços com parceiros confiáveis.", href: "/marketplace" },
  { icon: Sparkles, title: "IA ECOPET", desc: "Triagem, nutrição e assistente inteligente.", href: "/cadastro" },
  { icon: Stethoscope, title: "Saúde Animal", desc: "Prontuário, vacinas e histórico completo.", href: "/cadastro" },
  { icon: Heart, title: "ONGs & Adoção", desc: "Conecte protetores e tutores responsáveis.", href: "/cadastro" },
  { icon: Shield, title: "Parceiros & AgroPet", desc: "Gestão para clínicas, petshops e produtores.", href: "/cadastro" },
];

const TESTIMONIALS = [
  { name: "Marina S.", role: "Tutora", text: "Finalmente um app que une saúde, compras e comunidade sem parecer genérico." },
  { name: "Dr. Paulo R.", role: "Veterinário parceiro", text: "Prontuário e agendamento integrados — padrão internacional de UX." },
  { name: "ONG Patinhas", role: "Organização", text: "Adoção e divulgação com ferramentas profissionais e acessíveis." },
];

const FAQ = [
  { q: "Preciso pagar para usar a ECOPET?", a: "Não. O plano Free inclui feed social, cadastro de pet e IA básica. Planos premium ampliam recursos." },
  { q: "Posso explorar o marketplace sem conta?", a: "Sim. Visitantes navegam produtos e serviços publicamente. Carrinho e favoritos exigem login." },
  { q: "A IA substitui o veterinário?", a: "Não. A IA ECOPET é assistiva e informativa. Consulte sempre um profissional para diagnósticos." },
  { q: "A plataforma é acessível?", a: "Sim. Oferecemos VLibras, alto contraste, ajuste de fonte, leitor de tela e navegação por teclado." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] border border-ecopet-gray/10 bg-white dark:border-white/10 dark:bg-ecopet-dark-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ecopet-dark dark:text-white"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <p className="border-t border-ecopet-gray/10 px-5 py-4 text-sm leading-relaxed text-ecopet-gray dark:border-white/10">{a}</p>}
    </div>
  );
}


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ecopet-cream/30 dark:bg-[#0a0d10]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ecopet-gray/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1419]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <EcoPetLogo href="/" responsive priority />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
            <Link href="/marketplace" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">Marketplace</Link>
            <a href="#beneficios" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">Benefícios</a>
            <a href="#faq" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">FAQ</a>
            <Link href="/termos-de-uso" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">Termos</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link href="/cadastro"><Button size="sm">Criar Conta</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-ecopet-brand/5 via-transparent to-ecopet-yellow/5" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-ecopet-green/10 px-4 py-1.5 text-sm font-semibold text-ecopet-green">
                <Sparkles className="h-4 w-4" aria-hidden /> Super App Pet Premium
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ecopet-dark dark:text-white lg:text-6xl">
                Cuidado, tecnologia e confiança para quem ama pets
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ecopet-gray">
                Marketplace robusto, saúde animal, IA inteligente e rede social — tudo em uma plataforma premium internacional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cadastro"><Button size="lg">Criar Conta Grátis</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Entrar</Button></Link>
                <Link href="/marketplace"><Button variant="ghost" size="lg">Ver Marketplace <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
              </div>
              <p className="mt-4 text-xs text-ecopet-gray">{AI_DISCLAIMER}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="relative aspect-[4/3] overflow-hidden rounded-[24px] shadow-premium-lg lg:ml-auto">
              <Image src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900" alt="Cão feliz em ambiente acolhedor" fill className="object-cover" priority sizes="(max-width:768px) 100vw, 50vw" />
              <div className="absolute inset-x-4 bottom-4 rounded-[16px] border border-white/20 bg-white/90 p-4 backdrop-blur-md dark:bg-[#0f1419]/90">
                <p className="text-sm font-semibold text-ecopet-dark dark:text-white">Assistente IA ECOPET</p>
                <p className="text-xs text-ecopet-gray">Lembrete: vacina V10 em 15 dias · Triagem disponível 24/7</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-ecopet-gray/10 bg-white py-10 dark:border-white/10 dark:bg-[#0f1419]" aria-label="Estatísticas">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-ecopet-green">{s.value}</p>
              <p className="mt-1 text-sm text-ecopet-gray">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] text-ecopet-gray/70">* Dados demonstrativos para apresentação do ecossistema</p>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ecopet-dark dark:text-white">Tudo em um ecossistema premium</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ecopet-gray">Inspirado em Chewy, Stripe e Nubank — simples, confiável e elegante.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className="group">
                <Card className="card-premium h-full">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-ecopet-green/10 text-ecopet-green transition group-hover:bg-ecopet-green group-hover:text-white">
                      <f.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-ecopet-dark dark:text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ecopet-gray">{f.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-ecopet-brand py-16 text-white" aria-label="Depoimentos">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold">Confiança de tutores e parceiros</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-white/10 bg-white/10 text-white backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 text-ecopet-yellow" aria-hidden>{[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/90">&ldquo;{t.text}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-white/60">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-2xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ecopet-dark dark:text-white">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ecopet-gray/10 bg-white py-16 dark:border-white/10 dark:bg-[#0f1419]">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ecopet-dark dark:text-white">Pronto para começar?</h2>
          <p className="mt-4 text-ecopet-gray">Crie sua conta e personalize seu ecossistema pet. Marketplace público disponível para visitantes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/cadastro"><Button size="lg">Criar Conta</Button></Link>
            <Link href="/login"><Button variant="outline" size="lg">Entrar</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
