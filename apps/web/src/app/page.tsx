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
import { useTranslation } from "@/providers/i18n-provider";

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
  const { t } = useTranslation();

  const STATS = [
    { value: "12k+", label: t("landing.stats.tutors") },
    { value: "850+", label: t("landing.stats.partners") },
    { value: "98%", label: t("landing.stats.satisfaction") },
    { value: "24/7", label: t("landing.stats.aiAvailable") },
  ];

  const FEATURES = [
    { icon: Users, title: t("landing.features.social.title"), desc: t("landing.features.social.desc"), href: "/cadastro" },
    { icon: ShoppingBag, title: t("landing.features.marketplace.title"), desc: t("landing.features.marketplace.desc"), href: "/marketplace" },
    { icon: Sparkles, title: t("landing.features.ai.title"), desc: t("landing.features.ai.desc"), href: "/cadastro" },
    { icon: Stethoscope, title: t("landing.features.health.title"), desc: t("landing.features.health.desc"), href: "/cadastro" },
    { icon: Heart, title: t("landing.features.adoption.title"), desc: t("landing.features.adoption.desc"), href: "/cadastro" },
    { icon: Shield, title: t("landing.features.partners.title"), desc: t("landing.features.partners.desc"), href: "/cadastro" },
  ];

  const TESTIMONIALS = [
    { name: t("landing.testimonials.marina.name"), role: t("landing.testimonials.marina.role"), text: t("landing.testimonials.marina.text") },
    { name: t("landing.testimonials.paulo.name"), role: t("landing.testimonials.paulo.role"), text: t("landing.testimonials.paulo.text") },
    { name: t("landing.testimonials.ong.name"), role: t("landing.testimonials.ong.role"), text: t("landing.testimonials.ong.text") },
  ];

  const FAQ = [
    { q: t("landing.faq.free.q"), a: t("landing.faq.free.a") },
    { q: t("landing.faq.marketplace.q"), a: t("landing.faq.marketplace.a") },
    { q: t("landing.faq.ai.q"), a: t("landing.faq.ai.a") },
    { q: t("landing.faq.accessibility.q"), a: t("landing.faq.accessibility.a") },
  ];

  return (
    <div className="min-h-screen bg-ecopet-cream/30 dark:bg-[#0a0d10]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-ecopet-gray/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1419]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <EcoPetLogo href="/" responsive priority />
          <nav className="hidden items-center gap-8 md:flex" aria-label={t("landing.mainNav")}>
            <Link href="/marketplace" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">{t("common.marketplace")}</Link>
            <a href="#beneficios" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">{t("common.benefits")}</a>
            <a href="#faq" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">{t("common.faq")}</a>
            <Link href="/termos-de-uso" className="text-sm font-medium text-ecopet-gray hover:text-ecopet-green">{t("common.terms")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">{t("common.signIn")}</Button></Link>
            <Link href="/cadastro"><Button size="sm">{t("common.createAccount")}</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-ecopet-brand/5 via-transparent to-ecopet-yellow/5" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-ecopet-green/10 px-4 py-1.5 text-sm font-semibold text-ecopet-green">
                <Sparkles className="h-4 w-4" aria-hidden /> {t("landing.badge")}
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ecopet-dark dark:text-white lg:text-6xl">
                {t("landing.heroTitle")}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ecopet-gray">
                {t("landing.heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cadastro"><Button size="lg">{t("common.createAccountFree")}</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">{t("common.signIn")}</Button></Link>
                <Link href="/marketplace"><Button variant="ghost" size="lg">{t("common.viewMarketplace")} <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
              </div>
              <p className="mt-4 text-xs text-ecopet-gray">{AI_DISCLAIMER}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="relative aspect-[4/3] overflow-hidden rounded-[24px] shadow-premium-lg lg:ml-auto">
              <Image src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900" alt="Cão feliz em ambiente acolhedor" fill className="object-cover" priority sizes="(max-width:768px) 100vw, 50vw" />
              <div className="absolute inset-x-4 bottom-4 rounded-[16px] border border-white/20 bg-white/90 p-4 backdrop-blur-md dark:bg-[#0f1419]/90">
                <p className="text-sm font-semibold text-ecopet-dark dark:text-white">{t("landing.aiAssistant")}</p>
                <p className="text-xs text-ecopet-gray">{t("landing.aiReminder")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-ecopet-gray/10 bg-white py-10 dark:border-white/10 dark:bg-[#0f1419]" aria-label={t("landing.statsSection")}>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 md:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-ecopet-green">{s.value}</p>
              <p className="mt-1 text-sm text-ecopet-gray">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] text-ecopet-gray/70">{t("landing.statsDisclaimer")}</p>
      </section>

      <section id="beneficios" className="py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ecopet-dark dark:text-white">{t("landing.benefitsTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ecopet-gray">{t("landing.benefitsSubtitle")}</p>
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

      <section className="bg-ecopet-brand py-16 text-white" aria-label={t("landing.testimonialsSection")}>
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold">{t("landing.testimonialsTitle")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <Card key={item.name} className="border-white/10 bg-white/10 text-white backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 text-ecopet-yellow" aria-hidden>{[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <p className="mt-3 text-sm leading-relaxed text-white/90">&ldquo;{item.text}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-white/60">{item.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto max-w-2xl px-4 lg:px-8">
          <h2 className="text-center font-display text-3xl font-bold text-ecopet-dark dark:text-white">{t("landing.faqTitle")}</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-ecopet-gray/10 bg-white py-16 dark:border-white/10 dark:bg-[#0f1419]">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
          <h2 className="font-display text-3xl font-bold text-ecopet-dark dark:text-white">{t("landing.ctaTitle")}</h2>
          <p className="mt-4 text-ecopet-gray">{t("landing.ctaSubtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/cadastro"><Button size="lg">{t("common.createAccount")}</Button></Link>
            <Link href="/login"><Button variant="outline" size="lg">{t("common.signIn")}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
