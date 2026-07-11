"use client";

import { useEffect, useState } from "react";
import { AIPrivacyNotice } from "@/components/features/ai/ai-privacy-notice";
import { EcoPetAIButton } from "@/components/features/ai/ecopet-ai-button";
import { useTranslation } from "@/providers/i18n-provider";

type Settings = {
  historyEnabled: boolean;
  personalizedRecommendations: boolean;
  retentionDays: number;
  consentAiProcessing: boolean;
};

export default function AiPrivacySettingsPage() {
  const { locale } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/ai/privacy", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setSettings(j.data?.settings ?? null))
      .catch(() => undefined);
  }, []);

  async function save(patch: Partial<Settings>) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ai/privacy", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      setSettings(json.data?.settings ?? settings);
      setMsg("Preferências salvas.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteHistory() {
    if (!confirm("Excluir todo o histórico de conversas com a IA?")) return;
    setLoading(true);
    await fetch("/api/ai/privacy", { method: "DELETE", credentials: "include" });
    setMsg("Histórico excluído.");
    setLoading(false);
  }

  async function exportData() {
    const res = await fetch("/api/ai/privacy/export", { credentials: "include" });
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecopet-ai-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">IA e privacidade</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Controle histórico, recomendações personalizadas e exportação dos seus dados de IA (LGPD).
        </p>
      </header>

      <AIPrivacyNotice locale={locale} />

      {!settings ? (
        <p className="text-sm text-zinc-500">Carregando…</p>
      ) : (
        <div className="space-y-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Salvar histórico de conversas</span>
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(e) => void save({ historyEnabled: e.target.checked })}
              disabled={loading}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Recomendações personalizadas</span>
            <input
              type="checkbox"
              checked={settings.personalizedRecommendations}
              onChange={(e) => void save({ personalizedRecommendations: e.target.checked })}
              disabled={loading}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Consentimento de tratamento pela IA</span>
            <input
              type="checkbox"
              checked={settings.consentAiProcessing}
              onChange={(e) => void save({ consentAiProcessing: e.target.checked })}
              disabled={loading}
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Retenção (dias)</span>
            <input
              type="number"
              min={7}
              max={3650}
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: Number(e.target.value) })}
              onBlur={() => void save({ retentionDays: settings.retentionDays })}
              className="w-24 rounded border px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
              disabled={loading}
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <EcoPetAIButton onClick={() => void exportData()} label="Exportar dados" />
        <button
          type="button"
          onClick={() => void deleteHistory()}
          className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
        >
          Excluir conversas
        </button>
      </div>
      {msg && <p className="text-sm text-emerald-700 dark:text-emerald-300">{msg}</p>}
    </div>
  );
}
