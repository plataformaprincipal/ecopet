"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, Plus, X } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";
import { formatCurrency } from "@/lib/i18n/format";
import {
  CAMPAIGN_CATEGORIES,
  CAMPAIGN_URGENCIES,
  type SerializedCampaign,
} from "@/lib/ong/serialize-campaign";

type Props = { initialCreate?: boolean };

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-zinc-100 text-zinc-600",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function NgoCampaignsManager({ initialCreate = false }: Props) {
  const { t, locale } = useTranslation();
  const [campaigns, setCampaigns] = useState<SerializedCampaign[] | null>(null);
  const [showForm, setShowForm] = useState(initialCreate);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("FOOD");
  const [urgency, setUrgency] = useState<string>("NORMAL");
  const [goalAmount, setGoalAmount] = useState("");
  const [activateNow, setActivateNow] = useState(true);

  const load = useCallback(() => {
    fetch("/api/ong/campaigns", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setCampaigns(json.data.campaigns);
      })
      .catch(() => setCampaigns([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/ong/campaigns", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          urgency,
          status: activateNow ? "ACTIVE" : "DRAFT",
          goalAmount: goalAmount ? Number(goalAmount) : null,
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setGoalAmount("");
        setShowForm(false);
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
          {t("ngoArea.campaigns.title")}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          {showForm ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          {t("ngoArea.campaigns.create")}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("ngoArea.campaigns.titleField")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("ngoArea.campaigns.descriptionField")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={3}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("ngoArea.campaigns.category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              >
                {CAMPAIGN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`ngoArea.campaigns.cat.${c}` as string)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("ngoArea.campaigns.urgency")}
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              >
                {CAMPAIGN_URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {t(`ngoArea.campaigns.urg.${u}` as string)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("ngoArea.campaigns.goal")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input type="checkbox" checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} />
            {t("ngoArea.campaigns.st.ACTIVE")}
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
          >
            {t("ngoArea.campaigns.save")}
          </button>
        </form>
      ) : null}

      {campaigns === null ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-900/60">
          <Megaphone className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">{t("ngoArea.campaigns.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                  {t(`ngoArea.campaigns.cat.${c.category}` as string)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[c.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                  {t(`ngoArea.campaigns.st.${c.status}` as string)}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-zinc-900 dark:text-white">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{c.description}</p>
              {c.goalAmount ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {formatCurrency(c.raisedAmount, locale)} {t("ngoArea.campaigns.of")}{" "}
                  {formatCurrency(c.goalAmount, locale)} {t("ngoArea.campaigns.raised")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
