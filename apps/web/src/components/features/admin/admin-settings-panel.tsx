"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "./ui/admin-page-header";
import { AdminAlert } from "./admin-alert";

type Settings = {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  institutionalText: string | null;
  supportEmail: string | null;
  contactEmail: string | null;
  marketplaceEnabled: boolean;
};

export function AdminSettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Erro ao carregar");
      setSettings(data.data.settings);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Erro ao salvar");
      setSettings(data.data.settings);
      setSuccess("Configurações salvas com sucesso.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Configurações" />
        <p className="p-6 text-sm text-muted-foreground" role="status">Carregando…</p>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <AdminPageHeader title="Configurações" />
        <p className="p-6 text-sm text-red-600" role="alert">{error || "Configurações indisponíveis."}</p>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Configurações da Plataforma"
        description="Preferências gerais da plataforma EcoPet. Alterações geram AuditLog."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Configurações" }]}
      />
      <div className="max-w-2xl space-y-6 p-6">
        {success && <AdminAlert type="success" message={success} onDismiss={() => setSuccess("")} />}
        {error && <AdminAlert type="error" message={error} onDismiss={() => setError("")} />}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="h-4 w-4 rounded border"
          />
          <span className="text-sm font-medium">Modo manutenção</span>
        </label>

        <div>
          <label htmlFor="maintenanceMessage" className="mb-1 block text-sm font-medium">
            Mensagem de manutenção
          </label>
          <Input
            id="maintenanceMessage"
            value={settings.maintenanceMessage ?? ""}
            onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value || null })}
          />
        </div>

        <div>
          <label htmlFor="institutionalText" className="mb-1 block text-sm font-medium">
            Texto institucional
          </label>
          <textarea
            id="institutionalText"
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={settings.institutionalText ?? ""}
            onChange={(e) => setSettings({ ...settings, institutionalText: e.target.value || null })}
          />
        </div>

        <div>
          <label htmlFor="supportEmail" className="mb-1 block text-sm font-medium">
            E-mail de suporte
          </label>
          <Input
            id="supportEmail"
            type="email"
            value={settings.supportEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value || null })}
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">
            E-mail de contato
          </label>
          <Input
            id="contactEmail"
            type="email"
            value={settings.contactEmail ?? ""}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value || null })}
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.marketplaceEnabled}
            onChange={(e) => setSettings({ ...settings, marketplaceEnabled: e.target.checked })}
            className="h-4 w-4 rounded border"
          />
          <span className="text-sm font-medium">Marketplace habilitado</span>
        </label>

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </>
  );
}
