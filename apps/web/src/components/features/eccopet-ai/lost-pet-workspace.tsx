"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, PawPrint, Share2, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { requestBrowserGeo, readStoredAiGeo } from "@/lib/ai/client-geo";
import { petsApi } from "@/lib/pets/api";
import { cn } from "@/lib/utils";
import type { PetAIContext } from "@/lib/ai/pet-context";

type LostStep =
  | "select_pet"
  | "last_location"
  | "search_area"
  | "plan"
  | "share"
  | "active"
  | "found";

type Props = {
  pets: { id: string; name: string; species: string }[];
  petContext?: PetAIContext | null;
  activePetId?: string | null;
  onPetChange?: (id: string) => void;
  token?: string | null;
  isGuest: boolean;
  onLoginRequired?: () => void;
  onAskAi: (prompt: string) => void;
};

export function LostPetWorkspace({
  pets,
  petContext,
  activePetId,
  onPetChange,
  token,
  isGuest,
  onLoginRequired,
  onAskAi,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<LostStep>("select_pet");
  const [city, setCity] = useState("");
  const [when, setWhen] = useState("");
  const [contact, setContact] = useState("");
  const [radiusKm, setRadiusKm] = useState(2);
  const [geoState, setGeoState] = useState<"unknown" | "requesting" | "granted" | "denied" | "manual">(
    readStoredAiGeo() ? "granted" : "unknown"
  );
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmShare, setConfirmShare] = useState(false);
  const [confirmFound, setConfirmFound] = useState(false);

  const pet = useMemo(
    () => pets.find((p) => p.id === (activePetId ?? petContext?.id)) ?? pets[0] ?? null,
    [pets, activePetId, petContext]
  );

  async function requestLocation() {
    setGeoState("requesting");
    const result = await requestBrowserGeo();
    if (result.ok) {
      setGeoState("granted");
      if (!city.trim()) setCity(t("ecopetAi.workspace.lost.approxArea"));
    } else {
      setGeoState(result.reason === "DENIED" ? "denied" : "manual");
    }
  }

  function shareText() {
    return [
      t("ecopetAi.workspace.lost.shareTitle"),
      pet ? `${pet.name} · ${pet.species}` : "",
      city ? `${t("ecopetAi.workspace.lost.lastSeen")}: ${city}` : "",
      when ? `${t("ecopetAi.workspace.lost.when")}: ${when}` : "",
      contact ? `${t("ecopetAi.workspace.lost.contact")}: ${contact}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function markLost() {
    if (isGuest) {
      onLoginRequired?.();
      return;
    }
    if (!token || !pet) {
      setStatusMsg(t("ecopetAi.workspace.lost.needPet"));
      return;
    }
    setBusy(true);
    try {
      await petsApi(token).markLost(pet.id, {
        lostCity: city.trim() || t("ecopetAi.workspace.lost.approxArea"),
        lostContact: contact.trim() || "-",
      });
      setStep("active");
      setStatusMsg(t("ecopetAi.workspace.lost.markedLost"));
    } catch {
      setStatusMsg(t("ecopetAi.errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function markFound() {
    if (!token || !pet) return;
    setBusy(true);
    try {
      await petsApi(token).markFound(pet.id);
      setStep("found");
      setConfirmFound(false);
      setStatusMsg(t("ecopetAi.workspace.lost.markedFound"));
    } catch {
      setStatusMsg(t("ecopetAi.errors.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmShareAction() {
    const text = shareText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be denied */
    }
    setConfirmShare(false);
    window.location.href = "/feed";
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-subtle)]">
          {t("ecopetAi.capabilities.lost_pet.name")}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--ep-fg)]">
          {t("ecopetAi.workspace.lost.title")}
        </h2>
        <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.lost.subtitle")}</p>
      </header>

      <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <label className="text-xs font-medium text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.lost.pet")}
        </label>
        {pets.length ? (
          <select
            value={pet?.id ?? ""}
            onChange={(e) => {
              onPetChange?.(e.target.value);
              setStep("last_location");
            }}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.species}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--ep-fg-muted)]">
            <PawPrint className="h-4 w-4" aria-hidden />
            {t("ecopetAi.context.registerPet")}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 space-y-3">
        <p className="text-sm font-medium text-[var(--ep-fg)]">{t("ecopetAi.workspace.lost.where")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void requestLocation()}
            disabled={geoState === "requesting"}
            className="rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs font-medium text-[var(--ep-fg)] hover:bg-[var(--ep-bg-muted)]"
          >
            <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {t("ecopetAi.workspace.lost.useLocation")}
          </button>
          <button
            type="button"
            onClick={() => setGeoState("manual")}
            className="rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs font-medium text-[var(--ep-fg)] hover:bg-[var(--ep-bg-muted)]"
          >
            {t("ecopetAi.workspace.lost.manualLocation")}
          </button>
        </div>
        {geoState === "denied" ? (
          <p className="text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.lost.locationDenied")}</p>
        ) : null}
        <input
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setGeoState("manual");
          }}
          placeholder={t("ecopetAi.workspace.lost.cityPlaceholder")}
          className="w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm text-[var(--ep-fg)]"
        />
        <label className="block text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.lost.when")}
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
        <label className="block text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.lost.contact")}
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 space-y-2">
        <p className="text-sm font-medium text-[var(--ep-fg)]">{t("ecopetAi.workspace.lost.radiusTitle")}</p>
        <p className="text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.lost.radiusHint")}</p>
        <input
          type="range"
          min={1}
          max={10}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-[var(--ep-fg-subtle)]">
          {t("ecopetAi.workspace.lost.radiusValue", { km: String(radiusKm) })}
        </p>
      </div>

      {step === "plan" || step === "share" || step === "active" || step === "found" ? (
        <ul className="space-y-2 rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4 text-sm text-[var(--ep-fg-muted)]">
          <li>{t("ecopetAi.workspace.lost.plan1")}</li>
          <li>{t("ecopetAi.workspace.lost.plan2")}</li>
          <li>{t("ecopetAi.workspace.lost.plan3")}</li>
          <li>{t("ecopetAi.workspace.lost.plan4")}</li>
        </ul>
      ) : null}

      {statusMsg ? <p className="text-xs text-[var(--ep-fg-muted)]">{statusMsg}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setStep("plan");
            onAskAi(
              t("ecopetAi.workspace.lost.aiPrompt", {
                pet: pet?.name ?? "",
                city: city || t("ecopetAi.workspace.lost.approxArea"),
                radius: String(radiusKm),
              })
            );
          }}
          className="rounded-full bg-ecopet-green px-4 py-2 text-xs font-semibold text-white"
        >
          {t("ecopetAi.workspace.lost.startPlan")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void markLost()}
          className="rounded-full border border-[var(--ep-border)] px-4 py-2 text-xs font-medium text-[var(--ep-fg)]"
        >
          {t("ecopetAi.workspace.lost.markLost")}
        </button>
        <button
          type="button"
          onClick={() => setConfirmShare(true)}
          className="rounded-full border border-[var(--ep-border)] px-4 py-2 text-xs font-medium text-[var(--ep-fg)]"
        >
          <Share2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          {t("ecopetAi.workspace.lost.share")}
        </button>
        <button
          type="button"
          onClick={() => setConfirmFound(true)}
          className={cn(
            "rounded-full border border-[var(--ep-border)] px-4 py-2 text-xs font-medium",
            step === "found" ? "text-ecopet-green" : "text-[var(--ep-fg)]"
          )}
        >
          <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          {t("ecopetAi.workspace.lost.markFound")}
        </button>
      </div>

      {confirmShare ? (
        <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] p-4 text-sm">
          <p className="font-medium text-[var(--ep-fg)]">{t("ecopetAi.workspace.lost.shareConfirmTitle")}</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-[var(--ep-fg-muted)]">{shareText()}</pre>
          <p className="mt-2 text-xs text-[var(--ep-fg-subtle)]">{t("ecopetAi.workspace.lost.shareConfirmHint")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmShareAction()}
              className="rounded-full bg-ecopet-green px-4 py-1.5 text-xs font-semibold text-white"
            >
              {t("ecopetAi.confirm.confirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmShare(false)}
              className="rounded-full border border-[var(--ep-border)] px-4 py-1.5 text-xs"
            >
              {t("ecopetAi.confirm.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {confirmFound ? (
        <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-muted)] p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-[var(--ep-fg)]">
            <ShieldAlert className="h-4 w-4" aria-hidden />
            {t("ecopetAi.workspace.lost.foundConfirm")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void markFound()}
              className="rounded-full bg-ecopet-green px-4 py-1.5 text-xs font-semibold text-white"
            >
              {t("ecopetAi.confirm.confirm")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmFound(false)}
              className="rounded-full border border-[var(--ep-border)] px-4 py-1.5 text-xs"
            >
              {t("ecopetAi.confirm.cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
