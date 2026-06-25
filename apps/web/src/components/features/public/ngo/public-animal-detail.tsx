"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, MapPin, Heart, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  size: string | null;
  sex: string | null;
  vaccinated: boolean;
  neutered: boolean;
  photos: string[];
  description: string;
  requirementsText: string;
  displayStatus: string;
  status: string;
  ong: { id: string; name: string; city: string | null; state: string | null; description: string | null };
};

export function PublicAnimalDetail({ listingId }: { listingId: string }) {
  const { t } = useTranslation();
  const [animal, setAnimal] = useState<Animal | null | "notfound">(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    fetch(`/api/public/adoption/${listingId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setAnimal(json.data.animal);
        else setAnimal("notfound");
      })
      .catch(() => setAnimal("notfound"));
  }, [listingId]);

  async function requestAdoption() {
    setSending(true);
    setNeedLogin(false);
    try {
      const res = await fetch("/api/adoption-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message }),
      });
      if (res.status === 401) {
        setNeedLogin(true);
        return;
      }
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (animal === null) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-3xl bg-zinc-100 dark:bg-white/5" aria-busy="true" />
      </main>
    );
  }
  if (animal === "notfound") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <PawPrint className="mx-auto h-12 w-12 text-zinc-300" aria-hidden />
        <p className="mt-4 text-zinc-500">{t("ngoArea.public.emptyAnimals")}</p>
        <Link href="/adoption" className="mt-4 inline-block text-rose-500 underline">
          {t("ngoArea.public.adoptionTitle")}
        </Link>
      </main>
    );
  }

  const adopted = animal.status === "ADOPTED";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-zinc-100 dark:bg-white/5">
          {animal.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={animal.photos[0]} alt={animal.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <PawPrint className="h-16 w-16 text-zinc-300" aria-hidden />
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">{animal.name}</h1>
          <p className="mt-1 text-zinc-500">
            {animal.breed || "SRD"} · {animal.species}
            {animal.age ? ` · ${animal.age}` : ""}
          </p>
          <Link
            href={`/ngos/${animal.ong.id}`}
            className="mt-2 inline-flex items-center gap-1 text-sm text-rose-500 hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {animal.ong.name}
            {animal.ong.city ? ` · ${animal.ong.city}` : ""}
          </Link>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {animal.vaccinated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Vacinado
              </span>
            ) : null}
            {animal.neutered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden /> Castrado
              </span>
            ) : null}
            {animal.size ? (
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                {animal.size}
              </span>
            ) : null}
          </div>

          <section className="mt-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("ngoArea.public.aboutAnimal")}</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{animal.description}</p>
          </section>

          {animal.requirementsText ? (
            <section className="mt-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("ngoArea.public.requirements")}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">
                {animal.requirementsText}
              </p>
            </section>
          ) : null}

          <div className="mt-6">
            {adopted ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-500 dark:bg-white/10">
                <Heart className="h-4 w-4" aria-hidden />
                {t("ngoArea.public.adopted")}
              </span>
            ) : sent ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {t("ngoArea.public.requestSent")}
              </span>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={t("ngoArea.public.messagePlaceholder")}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
                />
                {needLogin ? (
                  <Link
                    href={`/login?callbackUrl=/adoption/${listingId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {t("ngoArea.public.loginToAdopt")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={requestAdoption}
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                  >
                    <Heart className="h-4 w-4" aria-hidden />
                    {t("ngoArea.public.sendRequest")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
