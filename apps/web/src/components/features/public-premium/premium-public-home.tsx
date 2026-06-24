"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Heart,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/design-system/motion";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1920&q=80";

function FullBleed({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative left-1/2 right-1/2 -mx-[50vw] w-screen ${className}`}>{children}</div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn>
          <h2 id={`${id}-title`} className="font-display text-3xl font-bold tracking-tight text-ecopet-dark dark:text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-lg text-ecopet-gray/90 dark:text-white/70">{subtitle}</p>
          )}
        </FadeIn>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export function PremiumPublicHome() {
  return (
    <div className="pb-8">
      {/* Hero fullscreen */}
      <FullBleed className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Tutor abraçando seu cão em ambiente acolhedor"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ecopet-dark/70 via-ecopet-dark/50 to-ecopet-dark/90" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-20 pt-32 sm:px-6 sm:pb-28">
          <FadeIn>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-md">
              <Heart className="h-4 w-4 text-ecopet-yellow" aria-hidden />
              Feito para quem ama animais
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Uma nova forma de cuidar, comprar, adotar e se conectar no universo pet.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
              Comunidade, marketplace, serviços, adoção e inteligência artificial em um só ecossistema.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-white px-8 text-ecopet-dark hover:bg-ecopet-cream">
                <Link href="/cadastro">Criar Conta</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
              >
                <Link href="/explorar">Explorar agora</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </FullBleed>

      <Section id="conheca" title="Conheça o EcoPet" subtitle="Cinco áreas para explorar antes mesmo de criar sua conta.">
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Rede Social", href: "/social", icon: Users, desc: "Comunidade Pet" },
            { label: "Explorar", href: "/explorar", icon: Compass, desc: "Descoberta visual" },
            { label: "Marketplace", href: "/marketplace", icon: ShoppingBag, desc: "Produtos e serviços" },
            { label: "EccoPet", href: "/eccopet", icon: Sparkles, desc: "Ferramentas de IA" },
            { label: "Perfil", href: "/perfil", icon: Heart, desc: "Entrar ou criar conta" },
          ].map((area) => (
            <StaggerItem key={area.href}>
              <Link
                href={area.href}
                className="card-premium group flex flex-col rounded-[20px] p-5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <area.icon className="h-7 w-7 text-ecopet-green transition group-hover:scale-110" aria-hidden />
                <p className="mt-4 font-semibold text-ecopet-dark dark:text-white">{area.label}</p>
                <p className="mt-1 text-sm text-ecopet-gray dark:text-white/60">{area.desc}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-ecopet-cream/60 dark:bg-ecopet-dark-card/40">
        <Section id="como-funciona" title="Como funciona" subtitle="Três passos para transformar a rotina do seu pet.">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Crie seu perfil", text: "Cadastre-se e adicione seu primeiro pet com foto e preferências." },
              { step: "02", title: "Descubra", text: "Explore serviços, produtos e ONGs perto de você." },
              { step: "03", title: "Cuide com carinho", text: "Agende, compre e acompanhe tudo em um só lugar." },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-ecopet-gray/10 bg-white p-8 dark:bg-ecopet-dark-card">
                  <span className="font-display text-5xl font-bold text-ecopet-green/20">{item.step}</span>
                  <h3 className="mt-4 text-xl font-semibold text-ecopet-dark dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ecopet-gray dark:text-white/70">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>
      </FullBleed>

      <Section id="marketplace" title="Marketplace" subtitle="Produtos selecionados com carinho — como Chewy, com alma brasileira.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Ração premium", "Higiene & banho", "Brinquedos", "Acessórios"].map((cat) => (
            <Link
              key={cat}
              href="/marketplace/produtos"
              className="group card-premium flex items-center justify-between rounded-2xl p-5"
            >
              <span className="font-medium">{cat}</span>
              <ShoppingBag className="h-5 w-5 text-ecopet-green transition group-hover:scale-110" aria-hidden />
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild className="rounded-2xl">
            <Link href="/marketplace">
              Explorar marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section id="servicos" title="Serviços" subtitle="Banho, tosa, veterinário e muito mais — agende com parceiros de confiança.">
        <Button asChild size="lg" variant="outline" className="rounded-2xl">
          <Link href="/servicos">Ver serviços disponíveis</Link>
        </Button>
      </Section>

      <FullBleed className="gradient-ecopet">
        <Section id="comunidade" title="Comunidade" subtitle="Compartilhe momentos, siga outros tutores e encontre inspiração." className="text-white">
          <div className="flex flex-wrap items-center gap-4">
            <MessageCircle className="h-10 w-10 text-ecopet-yellow" aria-hidden />
            <p className="max-w-xl text-lg text-white/90">
              Feed social com histórias reais, adoções e dicas — porque pet também é vida social.
            </p>
          </div>
          <Button asChild size="lg" className="mt-8 rounded-2xl bg-white text-ecopet-dark hover:bg-ecopet-cream">
            <Link href="/social">Ver comunidade</Link>
          </Button>
        </Section>
      </FullBleed>

      <Section id="ongs" title="ONGs" subtitle="Histórias de adoção, voluntariado e doações que mudam vidas.">
        <Button asChild className="rounded-2xl">
          <Link href="/adocao">Conhecer animais para adoção</Link>
        </Button>
      </Section>

      <FullBleed className="border-y border-ecopet-gray/10 bg-white dark:bg-ecopet-dark-card/30">
        <Section id="ia" title="EcoPet AI" subtitle="Seu assistente inteligente para rotina, alimentação e bem-estar — em breve, com a mesma experiência premium.">
          <div className="card-premium flex flex-col gap-6 rounded-2xl p-8 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ecopet-green/10">
              <Sparkles className="h-8 w-8 text-ecopet-green" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-ecopet-gray dark:text-white/70">
                Dúvidas veterinárias, recomendações personalizadas e lembretes inteligentes — tudo pensado para o vínculo com seu pet.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 rounded-2xl">
              <Link href="/eccopet">Conhecer EccoPet</Link>
            </Button>
          </div>
        </Section>
      </FullBleed>

      <Section id="depoimentos" title="Depoimentos" subtitle="Quem usa, recomenda.">
        <StaggerChildren className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Marina", text: "Encontrei banho e tosa perto de casa e acompanho tudo pelo app.", pet: "Luna, golden" },
            { name: "Ricardo", text: "Adotamos o Thor pela plataforma. A experiência foi emocionante.", pet: "Thor, vira-lata" },
            { name: "Ana", text: "Marketplace confiável e comunidade que realmente ajuda.", pet: "Mimi, gata" },
          ].map((t) => (
            <StaggerItem key={t.name}>
              <blockquote className="card-premium rounded-2xl p-6">
                <div className="flex gap-1 text-ecopet-yellow" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ecopet-gray dark:text-white/80">&ldquo;{t.text}&rdquo;</p>
                <footer className="mt-4 text-sm font-medium text-ecopet-dark dark:text-white">
                  {t.name} · <span className="font-normal text-ecopet-gray">{t.pet}</span>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <FullBleed className="bg-ecopet-dark">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <FadeIn>
            <Users className="mx-auto h-12 w-12 text-ecopet-yellow" aria-hidden />
            <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl">
              Comece hoje. Seu pet merece.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              Junte-se a milhares de tutores que já transformaram a forma de cuidar dos seus animais.
            </p>
            <Button asChild size="lg" className="mt-10 rounded-2xl bg-ecopet-yellow px-10 text-ecopet-dark hover:bg-ecopet-yellow/90">
              <Link href="/cadastro">Criar conta gratuita</Link>
            </Button>
          </FadeIn>
        </section>
      </FullBleed>
    </div>
  );
}
