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
import { PartnerRegisterForm } from "@/components/features/foundation/partner/partner-register-form";
import { StepValidationFeedback } from "@/components/features/foundation/step-validation-feedback";
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
import { collectUniqueErrorMessages, duplicateRegistrationError } from "@/lib/registration/collect-step-errors";
import { useDocumentAvailability } from "@/lib/registration/use-document-availability";
import { maskCnpj, onlyDigits, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import { cn } from "@/lib/utils";

export function FoundationRegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole | null>(null);
  const [roleError, setRoleError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stepFeedback, setStepFeedback] = useState<string[]>([]);
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
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setStepFeedback([]);
  }

  const cnpjAvailability = useDocumentAvailability("cnpj", role === "ONG" ? form.cnpj : "");

  function validateOngForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Informe o nome completo.";
    if (!form.email.trim()) errors.email = "Digite um e-mail válido.";
    if (!form.password) errors.password = "Senha obrigatória.";
    if (form.password !== form.confirmPassword) errors.confirmPassword = PASSWORD_MISMATCH_MESSAGE;
    const phoneFb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
    if (!phoneFb.valid) errors.phone = phoneFb.message ?? PHONE_INVALID_MESSAGE;
    if (!form.ongName.trim()) errors.ongName = "Informe o nome da ONG.";
    const cnpjDigits = onlyDigits(form.cnpj);
    if (!validateCnpjChecksum(cnpjDigits)) errors.cnpj = "Digite um CNPJ válido.";
    else if (cnpjAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
    if (!form.responsibleName.trim()) errors.responsibleName = "Informe o responsável.";
    if (!form.address.trim()) errors.address = "Informe o endereço.";
    if (!form.city.trim()) errors.city = "Informe a cidade.";
    if (form.state.trim().length !== 2) errors.state = "Informe a UF.";
    const pwdCheck = validateStrongPassword(form.password, { email: form.email, name: form.name });
    if (!pwdCheck.valid) errors.password = pwdCheck.error ?? "Senha não atende aos requisitos de segurança.";
    return errors;
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

    if (role === "ONG") {
      if (cnpjAvailability === "checking") {
        setStepFeedback(["Aguarde a verificação do CNPJ."]);
        return;
      }
      const errors = validateOngForm();
      setFieldErrors(errors);
      const messages = collectUniqueErrorMessages(errors);
      setStepFeedback(messages);
      if (messages.length > 0) return;
    }

    setLoading(true);
    setError("");
    setStepFeedback([]);

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

        {role === "PARTNER" && <PartnerRegisterForm embedded />}

        {role === "ONG" && (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-4" noValidate aria-describedby="register-form-hint-ong">
            <p id="register-form-hint-ong" className="text-sm text-muted-foreground">
              Campos com * são obrigatórios.
            </p>

            <Field id="register-name-ong" label="Nome completo" placeholder="Seu nome completo" value={form.name} onChange={(v) => setField("name", v)} required error={fieldErrors.name} />
            <Field id="register-email-ong" label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={(v) => setField("email", v)} required error={fieldErrors.email} />
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

            <Field label="Nome da ONG" value={form.ongName} onChange={(v) => setField("ongName", v)} required error={fieldErrors.ongName} />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setField("cnpj", maskCnpj(v))} required error={fieldErrors.cnpj} />
            <Field label="Responsável" value={form.responsibleName} onChange={(v) => setField("responsibleName", v)} required error={fieldErrors.responsibleName} />
            <Field label="Endereço" value={form.address} onChange={(v) => setField("address", v)} required error={fieldErrors.address} />
            <Field label="Cidade" value={form.city} onChange={(v) => setField("city", v)} required error={fieldErrors.city} />
            <Field label="UF" value={form.state} onChange={(v) => setField("state", v.toUpperCase())} required maxLength={2} error={fieldErrors.state} />

            {error && <p id="register-error-ong" className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading} aria-describedby={error ? "register-error-ong" : undefined}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
            <StepValidationFeedback messages={stepFeedback} />

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
  error,
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
  error?: string;
}) {
  const id = idProp ?? `register-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
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
        className={cn("mt-1", error && "border-red-500")}
        aria-label={label}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={!!error}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
