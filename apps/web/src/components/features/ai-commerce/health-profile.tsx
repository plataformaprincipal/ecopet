"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PetAiTimeline } from "./pet-timeline";
import { Sparkline } from "./sparkline";

type Dossier = {
  pet: { name: string; breed: string | null; species: string; weight: number | null; birthDate: string | null } | null;
  activated: boolean;
  cards: {
    weight: number | null;
    vaccines: number;
    medications: number;
    exams: number;
    lastVet: string | null;
    lastCheckup: string | null;
  };
  weights: Array<{ weight: number; recordedAt: string }>;
  vaccines: Array<{ name: string; date: string; nextDue: string | null }>;
  medications: Array<{ name: string; dosage: string | null }>;
  exams: Array<{ type: string; date: string }>;
  ia: Array<{ id: string; name: string; date: string; href?: string }>;
};

function ageLabel(birthDate: string | null | undefined) {
  if (!birthDate) return null;
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  return years > 0 ? `${years} anos` : "menos de 1 ano";
}

export function PetHealthProfilePanel({ petId }: { petId: string }) {
  const [tab, setTab] = useState("Visão geral");
  const [data, setData] = useState<Dossier | null>(null);
  useEffect(() => {
    fetch(`/api/ai-commerce/health-profile/${petId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
      });
  }, [petId]);

  const tabs = ["Visão geral", "Timeline", "Peso", "Vacinas", "Medicamentos", "Exames", "IA", "Documentos"];
  const pet = data?.pet;

  return (
    <section className="rounded-2xl border border-black/5 p-5 dark:border-white/10">
      <header>
        <p className="text-xs uppercase tracking-wide text-ecopet-green">Perfil de saúde</p>
        <h2 className="mt-1 text-2xl font-semibold">{pet?.name ?? "Pet"}</h2>
        <p className="text-sm text-muted-foreground">
          {[pet?.breed || pet?.species, ageLabel(pet?.birthDate)].filter(Boolean).join(" • ")}
        </p>
      </header>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            className={`rounded-full border px-3 py-1 text-sm ${tab === t ? "border-ecopet-green bg-ecopet-green/10" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Visão geral" && data && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <p>Peso: {data.cards.weight != null ? `${data.cards.weight} kg` : "—"}</p>
          <p>Vacinas: {data.cards.vaccines}</p>
          <p>Medicamentos: {data.cards.medications}</p>
          <p>Exames: {data.cards.exams}</p>
          <p>Último EccoVet: {data.cards.lastVet ? new Date(data.cards.lastVet).toLocaleDateString("pt-BR") : "—"}</p>
          <p>Último Checkup: {data.cards.lastCheckup ? new Date(data.cards.lastCheckup).toLocaleDateString("pt-BR") : "—"}</p>
        </div>
      )}
      {tab === "Timeline" && <PetAiTimeline petId={petId} />}
      {tab === "Peso" && (
        <div className="mt-4">
          <Sparkline
            title="Peso (kg)"
            unit="kg"
            points={[...(data?.weights ?? [])].reverse().map((w) => ({
              label: new Date(w.recordedAt).toLocaleDateString("pt-BR"),
              value: w.weight,
            }))}
          />
        </div>
      )}
      {tab === "Vacinas" && (
        <ul className="mt-4 space-y-2 text-sm">
          {(data?.vaccines ?? []).map((v) => (
            <li key={v.name + v.date}>
              {v.name} · {new Date(v.date).toLocaleDateString("pt-BR")}
            </li>
          ))}
          {!data?.vaccines.length && <li className="text-muted-foreground">Sem vacinas cadastradas.</li>}
        </ul>
      )}
      {tab === "Medicamentos" && (
        <ul className="mt-4 space-y-2 text-sm">
          {(data?.medications ?? []).map((m) => (
            <li key={m.name}>
              {m.name} {m.dosage ? `· ${m.dosage}` : ""}
            </li>
          ))}
          {!data?.medications.length && <li className="text-muted-foreground">Sem medicamentos cadastrados.</li>}
        </ul>
      )}
      {tab === "Exames" && (
        <ul className="mt-4 space-y-2 text-sm">
          {(data?.exams ?? []).map((e) => (
            <li key={e.type + e.date}>
              {e.type} · {new Date(e.date).toLocaleDateString("pt-BR")}
            </li>
          ))}
          {!data?.exams.length && <li className="text-muted-foreground">Sem exames cadastrados.</li>}
        </ul>
      )}
      {tab === "IA" && (
        <ul className="mt-4 space-y-2 text-sm">
          {(data?.ia ?? []).map((e) => (
            <li key={e.id}>
              {e.href ? (
                <Link href={e.href} className="text-ecopet-green hover:underline">
                  {e.name}
                </Link>
              ) : (
                e.name
              )}{" "}
              · {e.date ? new Date(e.date).toLocaleDateString("pt-BR") : ""}
            </li>
          ))}
        </ul>
      )}
      {tab === "Documentos" && (
        <p className="mt-4 text-sm">
          Exporte o dossiê em{" "}
          <Link href="/minha-conta/ia" className="text-ecopet-green hover:underline">
            Meus serviços de IA
          </Link>
          .
        </p>
      )}
    </section>
  );
}
