"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, MapPin, PawPrint, X } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { adoptionImageFallback, resolveMediaUrl } from "@/lib/media/fallbacks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSimpleLanguage } from "@/hooks/use-simple-language";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photos: string[];
  description: string;
  displayStatus: string;
  size?: string | null;
  sex?: string | null;
  vaccinated?: boolean | null;
  neutered?: boolean | null;
  ong: { id: string; name: string; city: string | null; state: string | null };
};

const SPECIES_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "DOG", label: "Cachorro" },
  { value: "CAT", label: "Gato" },
  { value: "RABBIT", label: "Coelho" },
  { value: "BIRD", label: "Ave" },
  { value: "OTHER", label: "Outros" },
];

const SEX_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "male", label: "Macho" },
  { value: "female", label: "Fêmea" },
  { value: "unknown", label: "Não informado" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "small", label: "Pequeno" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
];

const AGE_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "puppy", label: "Filhote" },
  { value: "young", label: "Jovem" },
  { value: "adult", label: "Adulto" },
  { value: "senior", label: "Idoso" },
];

type Filters = {
  species: string;
  sex: string;
  size: string;
  age: string;
  city: string;
  vaccinated: string;
  neutered: string;
  specialNeeds: string;
  q: string;
};

function filtersFromParams(sp: URLSearchParams): Filters {
  return {
    species: sp.get("species") ?? "",
    sex: sp.get("sex") ?? "",
    size: sp.get("size") ?? "",
    age: sp.get("age") ?? "",
    city: sp.get("city") ?? "",
    vaccinated: sp.get("vaccinated") ?? "",
    neutered: sp.get("neutered") ?? "",
    specialNeeds: sp.get("specialNeeds") ?? "",
    q: sp.get("q") ?? "",
  };
}

function countActive(f: Filters) {
  return Object.values(f).filter(Boolean).length;
}

export function PublicAdoptionGallery() {
  const { t } = useTranslation();
  const { s } = useSimpleLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(() => filtersFromParams(searchParams));

  const applied = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const activeCount = countActive(applied);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    Object.entries(applied).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return q.toString();
  }, [applied]);

  const load = useCallback(() => {
    let active = true;
    setAnimals(null);
    fetch(`/api/public/adoption${queryString ? `?${queryString}` : ""}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json?.success) {
          setAnimals(json.data.animals);
          setTotal(json.data.total ?? json.data.animals?.length ?? 0);
        } else {
          setAnimals([]);
          setTotal(0);
        }
      })
      .catch(() => {
        if (active) {
          setAnimals([]);
          setTotal(0);
        }
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  function applyFilters(next: Filters) {
    const q = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setFiltersOpen(false);
  }

  function clearFilters() {
    applyFilters({
      species: "",
      sex: "",
      size: "",
      age: "",
      city: "",
      vaccinated: "",
      neutered: "",
      specialNeeds: "",
      q: "",
    });
  }

  function openFiltersPanel() {
    setDraft(applied);
    setFiltersOpen(true);
    requestAnimationFrame(() => {
      document.getElementById("adocao-filtros")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const filterPanel = (
    <div
      id="adocao-filtros"
      className={cn(
        "rounded-3xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60",
        "lg:sticky lg:top-24"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-white">{s("Filtros")}</h2>
        {activeCount > 0 ? (
          <button type="button" className="text-xs font-medium text-ecopet-green" onClick={clearFilters}>
            {s("Limpar")}
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Busca")}
          <input
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
            placeholder="Nome do animal"
          />
        </label>
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Espécie")}
          <select
            value={draft.species}
            onChange={(e) => setDraft((d) => ({ ...d, species: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          >
            {SPECIES_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {s(o.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Sexo")}
          <select
            value={draft.sex}
            onChange={(e) => setDraft((d) => ({ ...d, sex: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          >
            {SEX_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {s(o.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Porte")}
          <select
            value={draft.size}
            onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {s(o.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Idade")}
          <select
            value={draft.age}
            onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
          >
            {AGE_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {s(o.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {s("Cidade")}
          <input
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950 dark:text-white"
            placeholder="Ex.: João Pessoa"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={draft.vaccinated === "true"}
            onChange={(e) => setDraft((d) => ({ ...d, vaccinated: e.target.checked ? "true" : "" }))}
          />
          {s("Vacinado")}
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={draft.neutered === "true"}
            onChange={(e) => setDraft((d) => ({ ...d, neutered: e.target.checked ? "true" : "" }))}
          />
          {s("Castrado")}
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={draft.specialNeeds === "true"}
            onChange={(e) => setDraft((d) => ({ ...d, specialNeeds: e.target.checked ? "true" : "" }))}
          />
          {s("Necessidades especiais")}
        </label>
      </div>
      <Button type="button" className="mt-4 w-full" onClick={() => applyFilters(draft)}>
        {s("Aplicar filtros")}
      </Button>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">
            {t("ngoArea.public.adoptionTitle")}
          </h1>
          <p className="mt-1 text-zinc-500">{t("ngoArea.public.adoptionSubtitle")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          onClick={openFiltersPanel}
          aria-expanded={filtersOpen}
        >
          <Filter className="mr-2 h-4 w-4" aria-hidden />
          {s("Filtros")}{activeCount ? ` (${activeCount})` : ""}
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        {filtersOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros de adoção">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Fechar filtros"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[var(--surface,#fff)] p-4 shadow-2xl dark:bg-zinc-950">
              <div className="mb-2 flex justify-end">
                <Button type="button" size="icon" variant="ghost" onClick={() => setFiltersOpen(false)} aria-label="Fechar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {filterPanel}
            </div>
          </div>
        ) : null}

        <section>
          {animals === null ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" />
              ))}
            </div>
          ) : animals.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-zinc-900/60">
              <PawPrint className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
              <p className="mt-4 text-zinc-500">{t("ngoArea.public.emptyAnimals")}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/ngos"
                  className="rounded-xl bg-ecopet-green px-4 py-2 text-sm font-semibold text-white hover:bg-ecopet-green-700"
                >
                  {t("ngoArea.public.exploreNgos")}
                </Link>
                <Button type="button" variant="outline" onClick={openFiltersPanel}>
                  {t("ngoArea.public.adjustFilters")}
                </Button>
                {activeCount > 0 ? (
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-zinc-500">{total} animal(is) encontrado(s)</p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {animals.map((a) => {
                  const img = resolveMediaUrl(a.photos[0], adoptionImageFallback());
                  return (
                    <Link
                      key={a.id}
                      href={`/adoption/${a.id}`}
                      className="group overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={a.photos[0] ? a.name : `${a.name} — foto ainda não cadastrada`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">{a.name}</h3>
                        <p className="text-sm text-zinc-500">
                          {a.breed || "SRD"} · {a.species}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" aria-hidden />
                          {a.ong.name}
                          {a.ong.city ? ` · ${a.ong.city}` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
