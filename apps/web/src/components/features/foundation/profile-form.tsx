"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/shared/auth/logout-button";

type Profile = {
  id: string;
  email: string;
  role: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  avatarUrl?: string | null;
  partnerProfile?: {
    businessName: string;
    legalName: string;
    cnpj: string;
    category: string;
    commercialEmail?: string | null;
    responsibleName?: string | null;
    address: string;
    city: string;
    state: string;
    zipCode?: string | null;
    description?: string | null;
    businessHours?: string | null;
    verificationStatus: string;
  } | null;
  ongProfile?: {
    ongName: string;
    cnpj: string;
    responsibleName: string;
    institutionalEmail?: string | null;
    address: string;
    city: string;
    state: string;
    zipCode?: string | null;
    description?: string | null;
    focusArea?: string | null;
    verificationStatus: string;
  } | null;
};

const verificationLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="mt-1"
      />
    </div>
  );
}

function TextArea({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

export function FoundationProfileForm({ dashboardPath = "/dashboard" }: { dashboardPath?: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/profile/me", { credentials: "include" })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login?callbackUrl=/perfil";
          return;
        }
        const data = await res.json();
        if (!res.ok || data.success === false) {
          setError(data.error?.message ?? data.error ?? "Erro ao carregar perfil");
          return;
        }
        const profileData = data.data?.profile ?? data.profile;
        setProfile(profileData);
        initForm(profileData);
      })
      .catch(() => setError("Não foi possível carregar o perfil."))
      .finally(() => setLoading(false));
  }, []);

  function initForm(p: Profile) {
    if (p.role === "CLIENT") {
      setForm({
        name: p.name ?? "",
        phone: p.phone ?? "",
        cpf: p.cpf ?? "",
        birthDate: p.birthDate ?? "",
        address: p.address ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
        zipCode: p.zipCode ?? "",
        avatarUrl: p.avatarUrl ?? "",
      });
    } else if (p.role === "PARTNER" && p.partnerProfile) {
      const pp = p.partnerProfile;
      setForm({
        businessName: pp.businessName,
        legalName: pp.legalName,
        cnpj: pp.cnpj,
        category: pp.category,
        phone: p.phone ?? "",
        commercialEmail: pp.commercialEmail ?? p.email,
        responsibleName: pp.responsibleName ?? p.name,
        address: pp.address,
        city: pp.city,
        state: pp.state,
        zipCode: pp.zipCode ?? "",
        description: pp.description ?? "",
        businessHours: pp.businessHours ?? "",
        avatarUrl: p.avatarUrl ?? "",
      });
    } else if (p.role === "ONG" && p.ongProfile) {
      const op = p.ongProfile;
      setForm({
        ongName: op.ongName,
        cnpj: op.cnpj,
        responsibleName: op.responsibleName,
        phone: p.phone ?? "",
        institutionalEmail: op.institutionalEmail ?? p.email,
        address: op.address,
        city: op.city,
        state: op.state,
        zipCode: op.zipCode ?? "",
        description: op.description ?? "",
        focusArea: op.focusArea ?? "",
      });
    }
  }

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setError(data.error?.message ?? data.error ?? "Erro ao salvar perfil");
        return;
      }
      const profileData = data.data?.profile ?? data.profile;
      setProfile(profileData);
      initForm(profileData);
      setSuccess(data.data?.message ?? data.message ?? "Perfil atualizado.");
    } catch {
      setError("Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Card className="mx-auto max-w-2xl"><CardContent className="p-8 text-center text-sm text-gray-600">Carregando perfil...</CardContent></Card>;
  }

  if (!profile) {
    return <Card className="mx-auto max-w-2xl"><CardContent className="p-8 text-center text-sm text-red-600">{error || "Perfil não encontrado."}</CardContent></Card>;
  }

  const verificationStatus =
    profile.partnerProfile?.verificationStatus ?? profile.ongProfile?.verificationStatus;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Meu perfil</CardTitle>
        <CardDescription>
          E-mail de login: <strong>{profile.email}</strong> (não editável nesta etapa)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationStatus && (
          <p className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-sm">
            Status de verificação: <strong>{verificationLabels[verificationStatus] ?? verificationStatus}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {profile.role === "CLIENT" && (
            <>
              <Field label="Nome completo" id="name" value={form.name ?? ""} onChange={(v) => setField("name", v)} required />
              <Field label="Telefone" id="phone" value={form.phone ?? ""} onChange={(v) => setField("phone", v)} required />
              <Field
                label="CPF"
                id="cpf"
                value={form.cpf ?? ""}
                onChange={(v) => setField("cpf", v)}
                disabled={Boolean(profile.cpf)}
                required={!profile.cpf}
              />
              {profile.cpf && (
                <p className="text-xs text-muted-foreground">CPF já cadastrado — não pode ser alterado nesta etapa.</p>
              )}
              <Field label="Data de nascimento" id="birthDate" type="date" value={form.birthDate ?? ""} onChange={(v) => setField("birthDate", v)} required />
              <Field label="Endereço" id="address" value={form.address ?? ""} onChange={(v) => setField("address", v)} required />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cidade" id="city" value={form.city ?? ""} onChange={(v) => setField("city", v)} required />
                <Field label="UF" id="state" value={form.state ?? ""} onChange={(v) => setField("state", v)} required />
                <Field label="CEP" id="zipCode" value={form.zipCode ?? ""} onChange={(v) => setField("zipCode", v)} required />
              </div>
              <FileUploadField
                purpose="user_avatar"
                label="Avatar"
                value={form.avatarUrl}
                onChange={(url) => setField("avatarUrl", url)}
                accept="image/jpeg,image/png,image/webp"
                allowManualUrl={false}
              />
            </>
          )}

          {profile.role === "PARTNER" && (
            <>
              <Field label="Nome fantasia" id="businessName" value={form.businessName ?? ""} onChange={(v) => setField("businessName", v)} required />
              <Field label="Razão social" id="legalName" value={form.legalName ?? ""} onChange={(v) => setField("legalName", v)} required />
              <Field label="CNPJ" id="cnpj" value={form.cnpj ?? ""} onChange={(v) => setField("cnpj", v)} required />
              <Field label="Categoria" id="category" value={form.category ?? ""} onChange={(v) => setField("category", v)} required />
              <Field label="Telefone" id="phone" value={form.phone ?? ""} onChange={(v) => setField("phone", v)} required />
              <Field label="E-mail comercial" id="commercialEmail" type="email" value={form.commercialEmail ?? ""} onChange={(v) => setField("commercialEmail", v)} required />
              <Field label="Responsável" id="responsibleName" value={form.responsibleName ?? ""} onChange={(v) => setField("responsibleName", v)} required />
              <Field label="Endereço" id="address" value={form.address ?? ""} onChange={(v) => setField("address", v)} required />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cidade" id="city" value={form.city ?? ""} onChange={(v) => setField("city", v)} required />
                <Field label="UF" id="state" value={form.state ?? ""} onChange={(v) => setField("state", v)} required />
                <Field label="CEP" id="zipCode" value={form.zipCode ?? ""} onChange={(v) => setField("zipCode", v)} />
              </div>
              <TextArea label="Descrição do negócio" id="description" value={form.description ?? ""} onChange={(v) => setField("description", v)} />
              <Field label="Horário de funcionamento" id="businessHours" value={form.businessHours ?? ""} onChange={(v) => setField("businessHours", v)} />
              <FileUploadField
                purpose="partner_logo"
                label="Logo da loja"
                value={form.avatarUrl}
                onChange={(url) => setField("avatarUrl", url)}
                accept="image/jpeg,image/png,image/webp"
                allowManualUrl={false}
              />
            </>
          )}

          {profile.role === "ONG" && (
            <>
              <Field label="Nome da ONG" id="ongName" value={form.ongName ?? ""} onChange={(v) => setField("ongName", v)} required />
              <Field label="CNPJ" id="cnpj" value={form.cnpj ?? ""} onChange={(v) => setField("cnpj", v)} required />
              <Field label="Responsável" id="responsibleName" value={form.responsibleName ?? ""} onChange={(v) => setField("responsibleName", v)} required />
              <Field label="Telefone" id="phone" value={form.phone ?? ""} onChange={(v) => setField("phone", v)} required />
              <Field label="E-mail institucional" id="institutionalEmail" type="email" value={form.institutionalEmail ?? ""} onChange={(v) => setField("institutionalEmail", v)} required />
              <Field label="Endereço" id="address" value={form.address ?? ""} onChange={(v) => setField("address", v)} required />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cidade" id="city" value={form.city ?? ""} onChange={(v) => setField("city", v)} required />
                <Field label="UF" id="state" value={form.state ?? ""} onChange={(v) => setField("state", v)} required />
                <Field label="CEP" id="zipCode" value={form.zipCode ?? ""} onChange={(v) => setField("zipCode", v)} />
              </div>
              <TextArea label="Descrição" id="description" value={form.description ?? ""} onChange={(v) => setField("description", v)} />
              <Field label="Área de atuação" id="focusArea" value={form.focusArea ?? ""} onChange={(v) => setField("focusArea", v)} />
            </>
          )}

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          {success && <p className="text-sm text-green-700" role="status">{success}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={dashboardPath}>Voltar ao dashboard</Link>
            </Button>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="mb-2 text-sm text-gray-600">Encerrar sessão neste dispositivo</p>
            <LogoutButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
