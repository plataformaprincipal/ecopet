"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductDefBySku } from "@/lib/ai-commerce/catalog";
import { getSpecialistProtocol } from "@/lib/ai-commerce/specialist-protocols";
import { getSpecialistExperience } from "@/lib/ai-commerce/specialist-experience";
import { isAiMonetizationFree } from "@/lib/ai-commerce/flags";
import { cn } from "@/lib/utils";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  birthDate?: string | null;
  weight?: number | null;
  photo?: string | null;
};

function ageLabel(birthDate: string | null | undefined) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

function listNames(value: unknown): string {
  if (!Array.isArray(value) || !value.length) return "Não registrado";
  return value
    .map((item) => {
      if (item && typeof item === "object" && "name" in item) return String((item as { name?: unknown }).name ?? "");
      return String(item);
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

export function SpecialistAvatar({ sku, size = 44 }: { sku: string; size?: number }) {
  const experience = getSpecialistExperience(sku);
  const letter = (getProductDefBySku(sku)?.name ?? "E").slice(0, 1);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
      style={{ width: size, height: size, background: experience?.accentColor ?? "#0F8A5F" }}
      aria-hidden
    >
      {letter}
    </span>
  );
}

export function SpecialistProductShell({
  sku,
  pet,
  petContext,
  priceLabel,
  children,
  history,
}: {
  sku: string;
  pet?: Pet | null;
  petContext?: Record<string, unknown> | null;
  priceLabel?: string;
  children: React.ReactNode;
  history?: Array<{ id: string; href: string; summary: string; when: string }>;
}) {
  const def = getProductDefBySku(sku);
  const protocol = getSpecialistProtocol(sku);
  const experience = getSpecialistExperience(sku);
  const [drawer, setDrawer] = useState(false);
  const free = isAiMonetizationFree();
  const health = (petContext?.health ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (!experience) return;
    document.documentElement.style.setProperty("--specialist-accent", experience.accentColor);
  }, [experience]);

  if (!def || !protocol || !experience) return <>{children}</>;

  const panel = (
    <div className="space-y-4">
      {pet ? (
        <aside className="rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: experience.accentColor }}>
            Pet
          </p>
          <div className="mt-3 flex items-center gap-3">
            {pet.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.photo} alt="" className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ep-bg)] text-lg font-semibold">
                {pet.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="font-semibold">{pet.name}</p>
              <p className="text-sm text-[var(--ep-fg-muted)]">{pet.breed || pet.species}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-[var(--ep-fg-muted)]">Idade</dt>
              <dd>{ageLabel(pet.birthDate) ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ep-fg-muted)]">Peso</dt>
              <dd>{pet.weight ? `${pet.weight} kg` : "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--ep-fg-muted)]">Alergias</dt>
              <dd>{listNames(health.allergies)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--ep-fg-muted)]">Medicações</dt>
              <dd>{listNames(petContext?.medications)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--ep-fg-muted)]">Vacinas</dt>
              <dd>{listNames(petContext?.vaccines)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--ep-fg-muted)]">Condições</dt>
              <dd>{String(health.conditions ?? "Não registrado")}</dd>
            </div>
          </dl>
        </aside>
      ) : null}

      <aside className="rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: experience.accentColor }}>
          {experience.historyLabel}
        </p>
        {!history?.length ? (
          <p className="mt-2 text-sm text-[var(--ep-fg-muted)]">Nenhuma análise deste especialista ainda.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="block rounded-xl border border-[var(--ep-border)] p-2 text-sm hover:border-[var(--specialist-accent)]">
                  <p className="line-clamp-2">{item.summary || "Análise concluída"}</p>
                  <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{item.when}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6" data-specialist={experience.accent}>
      <header className="flex items-start justify-between gap-3 rounded-[20px] border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <div className="flex min-w-0 items-start gap-3">
          <SpecialistAvatar sku={sku} />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: experience.accentColor }}>
              {protocol.specialistTitle}
            </p>
            <h1 className="truncate text-lg font-semibold sm:text-xl">{def.name}</h1>
            <p className="text-sm text-[var(--ep-fg-muted)]">
              {pet ? pet.name : "Selecione um pet"} · {free ? "Grátis no beta" : priceLabel ?? def.unitLabel}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)} aria-label="Abrir dados do pet">
          <Menu className="h-4 w-4" />
        </Button>
      </header>

      <section className="mt-4 rounded-[20px] border border-[var(--ep-border)] p-5" style={{ borderColor: `${experience.accentColor}33` }}>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{experience.heroTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ep-fg-muted)]">{experience.heroBody}</p>
        <p className="mt-3 text-sm">
          <span className="font-medium">O que este especialista faz: </span>
          {experience.whatItDoes}
        </p>
        <p className="mt-2 text-xs text-[var(--ep-fg-muted)]">~{experience.estimatedMinutes} min · {experience.acceptedInputs.join(" · ")}</p>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden lg:block">{panel}</div>
        <div className="min-w-0 pb-24 lg:pb-8">{children}</div>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fechar" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 w-[min(100%,360px)] overflow-y-auto bg-[var(--ep-bg)] p-4 shadow-xl">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDrawer(false)} aria-label="Fechar painel">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {panel}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SpecialistQuickChips({
  sku,
  onPick,
}: {
  sku: string;
  onPick: (chip: string) => void;
}) {
  const experience = getSpecialistExperience(sku);
  if (!experience) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {experience.quickChips.map((chip) => (
        <button
          key={chip}
          type="button"
          className={cn(
            "min-h-11 rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs font-medium",
            "hover:border-[var(--specialist-accent)]"
          )}
          onClick={() => onPick(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
