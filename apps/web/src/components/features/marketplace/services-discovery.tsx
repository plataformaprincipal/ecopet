"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeartHandshake, MapPin, PawPrint } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/marketplace/categories";
import {
  MARKETPLACE_DEFAULT_RADIUS_KM,
  type MarketplaceQuery,
} from "@/lib/marketplace/query-model";
import {
  SERVICE_RAILS,
  SERVICE_VERTICALS,
  getServiceVertical,
  suggestedServiceSlugsForSpecies,
  type ServiceRailId,
} from "@/lib/marketplace/service-verticals";
import type { PetSpecies } from "@/lib/pets/types";
import { useMarketplaceQuery } from "@/hooks/use-marketplace-query";
import { useUserLocation } from "@/hooks/use-user-location";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useActivePetForAi } from "@/hooks/use-active-pet-for-ai";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { ServicesPetProvider, type ServicesPetContextValue } from "./services-pet-context";

type ClientPet = {
  id: string;
  name: string;
  species: PetSpecies;
  photo: string | null;
};

function parsePetsPayload(body: unknown): ClientPet[] {
  if (!body || typeof body !== "object") return [];
  const data = "data" in body ? (body as { data?: unknown }).data : body;
  if (!data || typeof data !== "object") return [];
  const list = "pets" in data ? (data as { pets?: unknown }).pets : data;
  if (!Array.isArray(list)) return [];
  const pets: ClientPet[] = [];
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const pet = row as { id?: unknown; name?: unknown; species?: unknown; photo?: unknown };
    if (typeof pet.id !== "string" || typeof pet.name !== "string") continue;
    pets.push({
      id: pet.id,
      name: pet.name,
      species: (typeof pet.species === "string" ? pet.species : "OTHER") as PetSpecies,
      photo: typeof pet.photo === "string" ? pet.photo : null,
    });
  }
  return pets;
}

function activeRail(query: MarketplaceQuery): ServiceRailId | null {
  if (query.openToday) return "openToday";
  if (query.near && query.sort === "near_me") return "near";
  if (query.sort === "rating" && !query.near && !query.homeService && !query.verifiedOnly) return "rating";
  if (query.sort === "value") return "value";
  if (query.homeService && !query.group) return "home";
  if (query.verifiedOnly && !query.homeService && !query.openToday) return "verified";
  return null;
}

export function ServicesExperience({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { query, setQuery } = useMarketplaceQuery({ type: "service" });
  const location = useUserLocation();
  const { status } = useAuthSession();
  const [pets, setPets] = useState<ClientPet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const petIds = useMemo(() => pets.map((p) => p.id), [pets]);
  const { activePetId, setActivePetId } = useActivePetForAi(petIds);
  const activePet = pets.find((p) => p.id === activePetId) ?? null;

  useEffect(() => {
    if (status !== "authenticated") {
      setPets([]);
      setPetsLoaded(true);
      return;
    }
    let cancelled = false;
    fetch("/api/client/pets", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        setPets(parsePetsPayload(body));
      })
      .catch(() => {
        if (!cancelled) setPets([]);
      })
      .finally(() => {
        if (!cancelled) setPetsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const petContext = useMemo<ServicesPetContextValue>(
    () => ({
      petId: activePet?.id ?? null,
      petName: activePet?.name ?? null,
      petSpecies: activePet?.species ?? null,
    }),
    [activePet]
  );

  const rail = activeRail(query);
  const vertical = getServiceVertical(query.group);
  const suggestions = activePet ? suggestedServiceSlugsForSpecies(activePet.species) : [];

  function applyRail(id: ServiceRailId) {
    if (rail === id) {
      setQuery({
        near: false,
        openToday: undefined,
        homeService: undefined,
        verifiedOnly: undefined,
        sort: "relevance",
      });
      return;
    }
    if (id === "near") {
      if (location.known && location.coords) {
        setQuery({
          near: true,
          sort: "near_me",
          radiusKm: query.radiusKm ?? MARKETPLACE_DEFAULT_RADIUS_KM,
          city: location.meta.city,
          openToday: undefined,
        });
        return;
      }
      document.querySelector<HTMLButtonElement>("[data-testid='marketplace-near-me']")?.click();
      return;
    }
    if (id === "openToday") setQuery({ openToday: true, sort: query.sort === "near_me" ? query.sort : "relevance" });
    if (id === "rating") setQuery({ sort: "rating", openToday: undefined });
    if (id === "value") setQuery({ sort: "value", openToday: undefined });
    if (id === "home") setQuery({ homeService: true, openToday: undefined });
    if (id === "verified") setQuery({ verifiedOnly: true, openToday: undefined });
  }

  function applyVertical(id: string) {
    const next = getServiceVertical(id);
    if (!next) return;
    if (next.kind !== "catalog") return;
    if (query.group === id) {
      setQuery({ group: undefined, category: undefined });
      return;
    }
    setQuery({ group: id, category: undefined, type: "service" });
  }

  function selectPet(pet: ClientPet) {
    if (activePetId === pet.id && query.species === pet.species) {
      setQuery({ species: undefined });
      return;
    }
    setActivePetId(pet.id);
    setQuery({ species: pet.species, type: "service" });
  }

  return (
    <ServicesPetProvider value={petContext}>
      <div className="space-y-6">
      <section className="space-y-4" data-testid="services-discovery" aria-label={t("marketplace.servicesPage.aria")}>
        <div>
          <p className="text-sm text-[var(--ep-fg-muted)]">{t("marketplace.servicesPage.lead")}</p>
        </div>

        <div className="flex flex-wrap gap-2" data-testid="services-verticals">
          {SERVICE_VERTICALS.map((item) => {
            if (item.kind === "cta") {
              return (
                <div key={item.id} className="flex flex-wrap gap-2">
                  {item.hrefs?.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      data-testid={`services-vertical-${item.id}`}
                      className="rounded-full border border-ecopet-green/40 bg-ecopet-green/10 px-4 py-2 text-xs font-semibold text-ecopet-green"
                    >
                      {t(link.labelKey as never)}
                    </Link>
                  ))}
                </div>
              );
            }
            if (item.kind === "empty") {
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`services-vertical-${item.id}`}
                  className="rounded-full border border-[var(--ep-border)] px-4 py-2 text-xs font-semibold text-[var(--ep-fg-muted)]"
                  onClick={() => setQuery({ group: item.id, category: undefined, q: undefined })}
                >
                  {t(item.labelKey as never)}
                </button>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`services-vertical-${item.id}`}
                aria-pressed={query.group === item.id}
                onClick={() => applyVertical(item.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold",
                  query.group === item.id ? "bg-ecopet-green text-white" : "bg-[var(--ep-bg-muted)] text-[var(--ep-fg)]"
                )}
              >
                {t(item.labelKey as never)}
              </button>
            );
          })}
        </div>

        {vertical?.kind === "empty" ? (
          <p className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 text-sm text-[var(--ep-fg-muted)]" data-testid="services-memory-empty">
            {t("marketplace.servicesPage.verticals.memoryEmpty")}
          </p>
        ) : null}

        {vertical?.kind === "catalog" ? (
          <p className="text-xs text-[var(--ep-fg-muted)]">{t(vertical.hintKey as never)}</p>
        ) : null}

        <div className="flex flex-wrap gap-2" data-testid="services-rails">
          {SERVICE_RAILS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`services-rail-${item.id}`}
              aria-pressed={rail === item.id}
              onClick={() => applyRail(item.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold",
                rail === item.id ? "bg-ecopet-dark text-white" : "border border-[var(--ep-border)] text-[var(--ep-fg)]"
              )}
            >
              {item.id === "near" ? <MapPin className="h-3 w-3" aria-hidden /> : null}
              {t(item.labelKey as never)}
            </button>
          ))}
          <button
            type="button"
            data-testid="services-chip-telehealth"
            aria-pressed={Boolean(query.telehealth)}
            onClick={() => setQuery({ telehealth: query.telehealth ? undefined : true, group: query.telehealth ? query.group : "health" })}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold",
              query.telehealth ? "bg-ecopet-green text-white" : "border border-[var(--ep-border)]"
            )}
          >
            {t("marketplace.servicesPage.telehealth")}
          </button>
          <button
            type="button"
            data-testid="services-chip-mobile-grooming"
            aria-pressed={query.category === "banho-tosa" && Boolean(query.homeService)}
            onClick={() =>
              setQuery(
                query.category === "banho-tosa" && query.homeService
                  ? { category: undefined, homeService: undefined }
                  : { category: "banho-tosa", homeService: true, group: undefined }
              )
            }
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold",
              query.category === "banho-tosa" && query.homeService ? "bg-ecopet-green text-white" : "border border-[var(--ep-border)]"
            )}
          >
            {t("marketplace.servicesPage.mobileGrooming")}
          </button>
        </div>
        <p className="text-[11px] text-[var(--ep-fg-muted)]">{t("marketplace.servicesPage.openTodayHint")}</p>

        <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4" data-testid="services-pet-block">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <PawPrint className="h-4 w-4 text-ecopet-green" aria-hidden />
            {activePet
              ? t("marketplace.servicesPage.forPet", { name: activePet.name })
              : t("marketplace.servicesPage.forPetTitle")}
          </div>
          {status === "unauthenticated" ? (
            <p className="text-sm text-[var(--ep-fg-muted)]" data-testid="services-pet-guest">
              {t("marketplace.servicesPage.guestPet")}{" "}
              <Link href="/login?callbackUrl=%2Fmarketplace%2Fservicos" className="font-semibold text-ecopet-green">
                {t("marketplace.authModal.signIn")}
              </Link>
            </p>
          ) : null}
          {status === "authenticated" && petsLoaded && pets.length === 0 ? (
            <p className="text-sm text-[var(--ep-fg-muted)]" data-testid="services-pet-empty">
              {t("marketplace.servicesPage.noPets")}{" "}
              <Link href="/cliente/pets" className="font-semibold text-ecopet-green">
                {t("marketplace.servicesPage.addPet")}
              </Link>
            </p>
          ) : null}
          {pets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pets.map((pet) => (
                <button
                  key={pet.id}
                  type="button"
                  data-testid={`services-pet-${pet.id}`}
                  aria-pressed={activePetId === pet.id}
                  onClick={() => selectPet(pet)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-semibold",
                    activePetId === pet.id ? "bg-ecopet-green text-white" : "bg-[var(--ep-bg-muted)]"
                  )}
                >
                  {t("marketplace.servicesPage.forPet", { name: pet.name })}
                </button>
              ))}
            </div>
          ) : null}
          {activePet && suggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {suggestions.map((slug) => {
                const cat = SERVICE_CATEGORIES.find((c) => c.slug === slug);
                if (!cat) return null;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setQuery({ category: query.category === slug ? undefined : slug, group: undefined })}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium",
                      query.category === slug ? "bg-ecopet-green text-white" : "bg-ecopet-green/10 text-ecopet-green"
                    )}
                  >
                    {t(cat.labelKey as never)}
                  </button>
                );
              })}
            </div>
          ) : null}
          <p className="mt-2 flex items-start gap-1 text-[11px] text-[var(--ep-fg-muted)]">
            <HeartHandshake className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            {t("marketplace.servicesPage.noDiagnosis")}
          </p>
        </div>
      </section>
      {children}
      </div>
    </ServicesPetProvider>
  );
}
