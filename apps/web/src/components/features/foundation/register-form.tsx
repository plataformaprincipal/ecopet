"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CountryCode } from "libphonenumber-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import { InternationalPhoneField } from "@/components/features/foundation/international-phone-field";
import { ClientRegisterForm } from "@/components/features/foundation/client-register-form";
import {
  RegisterRoleSelector,
  REGISTER_ROLE_REQUIRED_MESSAGE,
  type RegisterRole,
} from "@/components/features/foundation/register-role-selector";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
} from "@/lib/password/validate-strong-password";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { notifySessionChanged } from "@/lib/auth/session-events";
import { confirmSessionCookie } from "@/lib/auth/confirm-session";
import { mapRegisterConflictMessage, parseApiFailureError } from "@/lib/api-errors";
import {
  resolveRegistrationPhoneE164,
  getPhoneLiveFeedback,
  BR_DDD_REQUIRED_MESSAGE,
  BR_PHONE_INVALID_MESSAGE,
  PHONE_INVALID_MESSAGE,
} from "@/lib/validation/international-phone";

export function FoundationRegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [roleError, setRoleError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("BR");
  const [brazilDdd, setBrazilDdd] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
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

  function handleRoleChange(next: RegisterRole) {
    setRole(next);
    setRoleError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!role) {
      setRoleError(REGISTER_ROLE_REQUIRED_MESSAGE);
      return;
    }

    setLoading(true);
    setError("");

    const normalizedPhone = resolveRegistrationPhoneE164(
      form.phone,
      phoneCountry,
      phoneCountry === "BR" ? brazilDdd : undefined
    );
    if (!normalizedPhone) {
      setError(
        phoneCountry === "BR" && !brazilDdd
          ? BR_DDD_REQUIRED_MESSAGE
          : phoneCountry === "BR"
            ? BR_PHONE_INVALID_MESSAGE
            : PHONE_INVALID_MESSAGE
      );
      setLoading(false);
      return;
    }

    const payload: Record<string, string> = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: normalizedPhone,
    };

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
      if (!res.ok || data.success === false) {
        const { code, message } = parseApiFailureError(data);
        const msg =
          res.status === 409
            ? mapRegisterConflictMessage(code, message)
            : message || "Erro ao cadastrar";
        setError(msg);
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.data?.user?.role ? dashboardPathForRole(data.data.user.role) : "/dashboard");
      const sessionReady = await confirmSessionCookie();
      if (!sessionReady) {
        setError("Conta criada, mas a sessão não foi iniciada. Tente entrar com seu e-mail e senha.");
        return;
      }
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader>
        <CardTitle>Criar conta EcoPet</CardTitle>
        <CardDescription>Escolha como deseja usar a plataforma e preencha seus dados.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        <RegisterRoleSelector value={role} onChange={handleRoleChange} error={roleError} />

        {role === "CLIENT" && <ClientRegisterForm embedded />}

        {role === "PARTNER" && (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-4" noValidate aria-describedby="register-form-hint">
            <p id="register-form-hint" className="text-sm text-muted-foreground">
              Campos com * são obrigatórios.
            </p>

            <Field id="register-name" label="Nome completo" placeholder="Seu nome completo" value={form.name} onChange={(v) => setField("name", v)} required hint="Como aparecerá no seu perfil." />
            <Field id="register-email" label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={(v) => setField("email", v)} required />
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
            <InternationalPhoneField
              id="register-phone"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              brazilDdd={brazilDdd}
              onBrazilDddChange={setBrazilDdd}
              required
              error={
                (() => {
                  const fb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
                  return fb.message && !fb.valid ? fb.message : undefined;
                })()
              }
            />

            <Field label="Nome fantasia" value={form.businessName} onChange={(v) => setField("businessName", v)} required />
            <Field label="Razão social" value={form.legalName} onChange={(v) => setField("legalName", v)} required />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", v)} required />
            <Field label="Categoria" value={form.category} onChange={(v) => setField("category", v)} required />
            <Field label="Endereço" value={form.address} onChange={(v) => setField("address", v)} required />
            <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required />
            <Field label="UF" value={form.state} onChange={(v) => setField("state", v)} required maxLength={2} />

            {error && <p id="register-error" className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading} aria-describedby={error ? "register-error" : undefined}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Já tem conta? <Link href="/login" className="font-semibold text-green-700 hover:underline">Entrar</Link>
            </p>
          </form>
        )}

        {role === "ONG" && (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-4" noValidate aria-describedby="register-form-hint-ong">
            <p id="register-form-hint-ong" className="text-sm text-muted-foreground">
              Campos com * são obrigatórios.
            </p>

            <Field id="register-name-ong" label="Nome completo" placeholder="Seu nome completo" value={form.name} onChange={(v) => setField("name", v)} required />
            <Field id="register-email-ong" label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={(v) => setField("email", v)} required />
            <FoundationPasswordField
              id="register-password-ong"
              label="Senha"
              value={form.password}
              onChange={(v) => setField("password", v)}
              context={{ email: form.email, name: form.name }}
              required
            />
            <FoundationConfirmPasswordField
              id="register-confirm-password-ong"
              label="Confirmar senha"
              value={form.confirmPassword}
              password={form.password}
              onChange={(v) => setField("confirmPassword", v)}
              required
            />
            <InternationalPhoneField
              id="register-phone-ong"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              brazilDdd={brazilDdd}
              onBrazilDddChange={setBrazilDdd}
              required
              error={
                (() => {
                  const fb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
                  return fb.message && !fb.valid ? fb.message : undefined;
                })()
              }
            />

            <Field label="Nome da ONG" value={form.ongName} onChange={(v) => setField("ongName", v)} required />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", v)} required />
            <Field label="Responsável" value={form.responsibleName} onChange={(v) => setField("responsibleName", v)} required />
            <Field label="Endereço" value={form.address} onChange={(v) => setField("address", v)} required />
            <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required />
            <Field label="UF" value={form.state} onChange={(v) => setField("state", v)} required maxLength={2} />

            {error && <p id="register-error-ong" className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading} aria-describedby={error ? "register-error-ong" : undefined}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Já tem conta? <Link href="/login" className="font-semibold text-green-700 hover:underline">Entrar</Link>
            </p>
          </form>
        )}

        {!role && (
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Selecione uma opção acima para continuar o cadastro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  id: idProp,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  hint,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  const id = idProp ?? `register-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        className="mt-1"
        aria-label={label}
        aria-describedby={hintId}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
