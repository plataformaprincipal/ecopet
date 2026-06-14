"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
} from "@/lib/password/validate-strong-password";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { notifySessionChanged } from "@/lib/auth/session-events";

type Role = "CLIENT" | "PARTNER" | "ONG";

export function FoundationRegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("CLIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthDate: "",
    businessName: "",
    legalName: "",
    cnpj: "",
    category: "",
    address: "",
    city: "",
    state: "",
    ongName: "",
    responsibleName: "",
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload: Record<string, string> = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: form.phone,
    };

    if (role === "CLIENT") {
      payload.birthDate = form.birthDate;
    }
    if (role === "PARTNER") {
      payload.businessName = form.businessName;
      payload.legalName = form.legalName;
      payload.cnpj = form.cnpj;
      payload.category = form.category;
      payload.address = form.address;
      payload.city = form.city;
      payload.state = form.state;
    }
    if (role === "ONG") {
      payload.ongName = form.ongName;
      payload.cnpj = form.cnpj;
      payload.responsibleName = form.responsibleName;
      payload.address = form.address;
      payload.city = form.city;
      payload.state = form.state;
    }

    if (form.password !== form.confirmPassword) {
      setError(PASSWORD_MISMATCH_MESSAGE);
      setLoading(false);
      return;
    }

    const pwdCheck = validateStrongPassword(form.password, {
      email: form.email,
      name: form.name,
    });
    if (!pwdCheck.valid) {
      setError(pwdCheck.error ?? "Senha não atende aos requisitos de segurança.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar");
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.data?.user?.role ? dashboardPathForRole(data.data.user.role) : "/dashboard");
      notifySessionChanged();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Criar conta EcoPet</CardTitle>
        <CardDescription>Escolha o tipo de conta e preencha seus dados.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {(["CLIENT", "PARTNER", "ONG"] as Role[]).map((r) => (
              <Button
                key={r}
                type="button"
                variant={role === r ? "default" : "outline"}
                onClick={() => setRole(r)}
              >
                {r === "CLIENT" ? "Cliente" : r === "PARTNER" ? "Parceiro" : "ONG"}
              </Button>
            ))}
          </div>

          <Field label="Nome completo" value={form.name} onChange={(v) => setField("name", v)} required />
          <Field label="E-mail" type="email" value={form.email} onChange={(v) => setField("email", v)} required />
          <FoundationPasswordField
            id="register-password"
            label="Senha"
            value={form.password}
            onChange={(v) => setField("password", v)}
            context={{ email: form.email, name: form.name }}
            required
          />
          <FoundationConfirmPasswordField
            id="register-confirm-password"
            label="Confirmar senha"
            value={form.confirmPassword}
            password={form.password}
            onChange={(v) => setField("confirmPassword", v)}
            required
          />
          <Field label="Telefone" value={form.phone} onChange={(v) => setField("phone", v)} required />

          {role === "CLIENT" && (
            <>
              <Field label="Data de nascimento" type="date" value={form.birthDate} onChange={(v) => setField("birthDate", v)} required />
            </>
          )}

          {role === "PARTNER" && (
            <>
              <Field label="Nome fantasia" value={form.businessName} onChange={(v) => setField("businessName", v)} required />
              <Field label="Razão social" value={form.legalName} onChange={(v) => setField("legalName", v)} required />
              <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", v)} required />
              <Field label="Categoria" value={form.category} onChange={(v) => setField("category", v)} required />
              <Field label="Endereço" value={form.address} onChange={(v) => setField("address", v)} required />
              <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required />
              <Field label="UF" value={form.state} onChange={(v) => setField("state", v)} required maxLength={2} />
            </>
          )}

          {role === "ONG" && (
            <>
              <Field label="Nome da ONG" value={form.ongName} onChange={(v) => setField("ongName", v)} required />
              <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", v)} required />
              <Field label="Responsável" value={form.responsibleName} onChange={(v) => setField("responsibleName", v)} required />
              <Field label="Endereço" value={form.address} onChange={(v) => setField("address", v)} required />
              <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required />
              <Field label="UF" value={form.state} onChange={(v) => setField("state", v)} required maxLength={2} />
            </>
          )}

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta? <Link href="/login" className="font-semibold text-green-700 hover:underline">Entrar</Link>
        </p>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        className="mt-1"
      />
    </div>
  );
}
