"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Stethoscope,
  Users,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AI_DISCLAIMER } from "@/lib/constants";

const features = [
  { icon: Users, title: "Rede Social Pet", desc: "Feed, stories, reels e comunidade integrada." },
  { icon: ShoppingBag, title: "Marketplace", desc: "Compre produtos e serviços com checkout seguro." },
  { icon: Sparkles, title: "IA ECOPET", desc: "Triagem, nutrição e assistente inteligente 24/7." },
  { icon: Stethoscope, title: "Prontuário Digital", desc: "Vacinas, exames, consultas e histórico completo." },
  { icon: Heart, title: "Adoção", desc: "Conecte ONGs e tutores em busca de um lar." },
  { icon: Shield, title: "Segurança Premium", desc: "RBAC, JWT e dados protegidos." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <header className="fixed inset-x-0 top-0 z-50 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <EcoPetLogo href="/" responsive priority />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">
              Recursos
            </a>
            <a href="#planos" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button size="sm">
                Começar grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-ecopet-dark/5 via-transparent to-ecopet-yellow/10" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-ecopet-green/10 px-4 py-1.5 text-sm font-semibold text-ecopet-green">
                <Sparkles className="h-4 w-4" /> Super App Pet + IA
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-ecopet-dark dark:text-white lg:text-6xl">
                O ecossistema que seu pet{" "}
                <span className="text-gradient-ecopet">merece</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-ecopet-gray">
                Marketplace, rede social, prontuário digital, IA e gestão completa — tudo em uma plataforma premium.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/onboarding">
                  <Button size="lg">Explorar ECOPET</Button>
                </Link>
                <Link href="/cadastro">
                  <Button variant="outline" size="lg">
                    Criar conta
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-ecopet-gray">{AI_DISCLAIMER}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative aspect-square max-h-[500px] overflow-hidden rounded-3xl shadow-2xl lg:ml-auto"
            >
              <Image
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
                alt="Pet feliz"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-ecopet-yellow flex items-center justify-center text-ecopet-dark font-bold">
                    IA
                  </div>
                  <div>
                    <p className="font-semibold text-ecopet-dark">Assistente ECOPET</p>
                    <p className="text-sm text-ecopet-gray">Lembrete: vacina V10 em 15 dias</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-50 dark:bg-[#0a0d10]">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ecopet-dark dark:text-white">
            Tudo que o universo pet precisa
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:border-ecopet-green/30">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ecopet-green/10 text-ecopet-green">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-ecopet-dark dark:text-white">{f.title}</h3>
                    <p className="mt-2 text-sm text-ecopet-gray">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold">Planos para cada jornada</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Free", price: "R$ 0", features: ["Feed social", "1 pet", "IA básica"] },
              { name: "Premium", price: "R$ 29,90/mês", features: ["Pets ilimitados", "IA avançada", "Selo premium"], highlight: true },
              { name: "Pro Vet", price: "R$ 99,90/mês", features: ["Dashboard clínico", "Prontuários", "Analytics"] },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-ecopet-yellow ring-2 ring-ecopet-yellow/30" : ""}
              >
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-extrabold text-ecopet-green">{plan.price}</p>
                  <ul className="mt-6 space-y-2 text-left text-sm text-ecopet-gray">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-ecopet-green" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/assinatura" className="mt-6 block">
                    <Button variant={plan.highlight ? "secondary" : "outline"} className="w-full">
                      Assinar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ecopet-gray/10 py-12 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row lg:px-8">
          <EcoPetLogo href="/" responsive priority />
          <p className="text-sm text-ecopet-gray">© 2026 ECOPET. Ecossistema pet inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
