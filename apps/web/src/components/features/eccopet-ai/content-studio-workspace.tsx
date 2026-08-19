"use client";

import { useMemo, useState } from "react";
import { Copy, Pencil, Sparkles } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import type { PetAIContext } from "@/lib/ai/pet-context";

const TYPES = ["caption", "description", "post", "memory", "translate", "rewrite"] as const;
const TONES = ["natural", "fun", "informative", "affectionate", "professional"] as const;

type Props = {
  pets: { id: string; name: string; species: string }[];
  petContext?: PetAIContext | null;
  activePetId?: string | null;
  onPetChange?: (id: string) => void;
  onAskAi: (prompt: string) => void;
  lastAssistantText?: string;
  generating?: boolean;
};

export function ContentStudioWorkspace({
  pets,
  petContext,
  activePetId,
  onPetChange,
  onAskAi,
  lastAssistantText,
  generating,
}: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<(typeof TYPES)[number]>("caption");
  const [tone, setTone] = useState<(typeof TONES)[number]>("natural");
  const [language, setLanguage] = useState("pt-BR");
  const [context, setContext] = useState("");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);

  const pet = useMemo(
    () => pets.find((p) => p.id === (activePetId ?? petContext?.id)) ?? pets[0],
    [pets, activePetId, petContext]
  );

  const display = preview || lastAssistantText || "";

  function generate() {
    const petLine = pet
      ? `${pet.name} (${pet.species}${petContext?.breed ? `, ${petContext.breed}` : ""})`
      : "";
    onAskAi(
      t("ecopetAi.workspace.studio.aiPrompt", {
        type: t(`ecopetAi.workspace.studio.types.${type}`),
        tone: t(`ecopetAi.workspace.studio.tones.${tone}`),
        language,
        pet: petLine || "—",
        context: context || "—",
      })
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function useInPost() {
    try {
      sessionStorage.setItem("ecopet:social:draft", display);
    } catch {
      /* ignore */
    }
    void copy();
    window.location.href = "/feed";
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-subtle)]">
          {t("ecopetAi.capabilities.content_studio.name")}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--ep-fg)]">
          {t("ecopetAi.workspace.studio.title")}
        </h2>
        <p className="mt-1 text-xs text-[var(--ep-fg-muted)]">{t("ecopetAi.workspace.studio.subtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.studio.type")}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          >
            {TYPES.map((id) => (
              <option key={id} value={id}>
                {t(`ecopetAi.workspace.studio.types.${id}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.studio.tone")}
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          >
            {TONES.map((id) => (
              <option key={id} value={id}>
                {t(`ecopetAi.workspace.studio.tones.${id}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--ep-fg-muted)]">
          {t("ecopetAi.workspace.studio.language")}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          >
            <option value="pt-BR">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>
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
        <label className="text-xs text-[var(--ep-fg-muted)] sm:col-span-2">
          {t("ecopetAi.workspace.studio.context")}
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] px-3 py-2 text-sm text-[var(--ep-fg)]"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={generating}
        onClick={generate}
        className="inline-flex items-center gap-1.5 rounded-full bg-ecopet-green px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t("ecopetAi.workspace.studio.generate")}
      </button>

      <div className="rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ep-fg-subtle)]">
          {t("ecopetAi.workspace.studio.preview")}
        </p>
        <p className="mt-1 text-[11px] text-[var(--ep-fg-subtle)]">{t("ecopetAi.workspace.studio.aiLabel")}</p>
        <textarea
          value={display}
          onChange={(e) => setPreview(e.target.value)}
          rows={6}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--ep-border)] bg-[var(--ep-bg)] px-3 py-2 text-sm text-[var(--ep-fg)]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs text-[var(--ep-fg)]"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? t("ecopetAi.workspace.studio.copied") : t("ecopetAi.workspace.studio.copy")}
          </button>
          <button
            type="button"
            onClick={() => setPreview(display)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--ep-border)] px-3 py-1.5 text-xs text-[var(--ep-fg)]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("ecopetAi.workspace.studio.edit")}
          </button>
          <button
            type="button"
            disabled={!display.trim()}
            onClick={useInPost}
            className="rounded-full bg-ecopet-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {t("ecopetAi.workspace.studio.useInPost")}
          </button>
        </div>
      </div>
    </section>
  );
}
