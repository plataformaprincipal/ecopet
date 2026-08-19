"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import type { PetAIContext } from "@/lib/ai/pet-context";

type CheckStatus = "pending" | "done" | "verify" | "na";

const CHECKLIST_KEYS = [
  "id",
  "microchip",
  "docs",
  "transport",
  "carrier",
  "food",
  "meds",
  "stay",
  "services",
  "contacts",
] as const;

type Props = {
  pets: { id: string; name: string; species: string }[];
  petContext?: PetAIContext | null;
  activePetId?: string | null;
  onPetChange?: (id: string) => void;
  onAskAi: (prompt: string) => void;
};

export function TravelWorkspace({ pets, petContext, activePetId, onPetChange, onAskAi }: Props) {
  const { t } = useTranslation();
  const petId = activePetId ?? petContext?.id ?? pets[0]?.id ?? "none";
  const storageKey = `ecopet:ai:travel:${petId}`;

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [transport, setTransport] = useState("");
  const [purpose, setPurpose] = useState("");
  const [checks, setChecks] = useState<Record<string, CheckStatus>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        origin?: string;
        destination?: string;
        date?: string;
        transport?: string;
        purpose?: string;
        checks?: Record<string, CheckStatus>;
      };
      setOrigin(parsed.origin ?? "");
      setDestination(parsed.destination ?? "");
      setDate(parsed.date ?? "");
      setTransport(parsed.transport ?? "");
      setPurpose(parsed.purpose ?? "");
      setChecks(parsed.checks ?? {});
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ origin, destination, date, transport, purpose, checks })
      );
    } catch {
      /* ignore */
    }
  }, [storageKey, origin, destination, date, transport, purpose, checks]);

  const pet = useMemo(
    () => pets.find((p) => p.id === petId) ?? pets[0],
    [pets, petId]
  );

  function cycle(status: CheckStatus): CheckStatus {
    if (status === "pending") return "done";
    if (status === "done") return "verify";
    if (status === "verify") return "na";
    return "pending";
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-subtle)]">
          {t("ecopetAi.capabilities.travel_agent.name")}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--ep-fg)]">
          {t("ecopetAi.workspace.travel.title")}
        </h2>
        <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.travel.subtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {pets.length ? (
          <label className="text-xs text-[var(--ep-fg-muted)]">
            {t("ecopetAi.header.pet")}
            <select
              value={pet?.id ?? ""}
              onChange={(e) => onPetChange?.(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.travel.origin")}
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.travel.destination")}
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.travel.date")}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.travel.transport")}
          <input
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            placeholder={t("ecopetAi.workspace.travel.transportPh")}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)] sm:col-span-2">
          {t("ecopetAi.workspace.travel.purpose")}
          <input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <p className="text-sm font-medium text-[var(--ep-fg)]">{t("ecopetAi.workspace.travel.checklist")}</p>
        <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.travel.legalHint")}</p>
        <ul className="mt-3 space-y-2">
          {CHECKLIST_KEYS.map((key) => {
            const status = checks[key] ?? "pending";
            return (
              <li key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[var(--ep-fg)]">{t(`ecopetAi.workspace.travel.items.${key}`)}</span>
                <button
                  type="button"
                  onClick={() => setChecks((c) => ({ ...c, [key]: cycle(status) }))}
                  className="rounded-full border border-[var(--ep-border)] px-2.5 py-1 text-[11px] text-[var(--ep-fg-muted)]"
                >
                  {t(`ecopetAi.workspace.travel.status.${status}`)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={() =>
          onAskAi(
            t("ecopetAi.workspace.travel.aiPrompt", {
              origin: origin || "—",
              destination: destination || "—",
              date: date || "—",
              pet: pet?.name ?? "—",
              transport: transport || "—",
            })
          )
        }
        className="rounded-full bg-ecopet-green px-4 py-2 text-xs font-semibold text-white"
      >
        {t("ecopetAi.workspace.travel.askAi")}
      </button>
    </section>
  );
}
