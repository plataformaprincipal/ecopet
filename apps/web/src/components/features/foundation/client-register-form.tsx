"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import { RegisterProgress } from "@/components/features/foundation/register-progress";
import {
  PASSWORD_MISMATCH_MESSAGE,
  validateStrongPassword,
} from "@/lib/password/validate-strong-password";
import {
  normalizeFullName,
  isValidFullName,
  FULL_NAME_INCOMPLETE_MESSAGE,
} from "@/lib/validation/full-name";
import type { CountryCode } from "libphonenumber-js";
import { InternationalPhoneField } from "@/components/features/foundation/international-phone-field";
import {
  getPhoneLiveFeedback,
  resolveRegistrationPhoneE164,
  BR_DDD_REQUIRED_MESSAGE,
  BR_PHONE_INVALID_MESSAGE,
  PHONE_INVALID_MESSAGE,
} from "@/lib/validation/international-phone";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { notifySessionChanged } from "@/lib/auth/session-events";
import { confirmSessionCookie } from "@/lib/auth/confirm-session";
import { mapRegisterConflictMessage, parseApiFailureError } from "@/lib/api-errors";
import {
  ClientLegalAcceptance,
  CLIENT_LEGAL_ACCEPTANCE_MESSAGE,
} from "@/components/features/foundation/client-legal-acceptance";
import {
  RegisterGenderSelector,
  GENDER_VALIDATION_MESSAGE,
} from "@/components/features/foundation/register-gender-selector";
import {
  getEmailLiveFeedback,
  EMAIL_INVALID_MESSAGE,
  isValidRegistrationEmail,
} from "@/lib/validation/email";
import {
  validateBirthDate,
  getBirthDateBounds,
} from "@/lib/validation/birth-date";
import { cn } from "@/lib/utils";

type Step = "personal" | "security" | "conclusion";

type FieldErrors = Record<string, string>;

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{4,30}$/;

export function ClientRegisterForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("BR");
  const [brazilDdd, setBrazilDdd] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    genderOther: "",
    username: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const passwordContext = useMemo(
    () => ({
      email: form.email.trim().toLowerCase(),
      name: normalizeFullName(form.name),
      username: form.username.toLowerCase(),
      phone: form.phone,
      birthDate: form.birthDate,
    }),
    [form.email, form.name, form.username, form.phone, form.birthDate]
  );

  const checkUsername = useCallback(async (username: string) => {
    const trimmed = username.trim();
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameStatus(trimmed.length > 0 ? "invalid" : "idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus(data.data?.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.username.trim().length >= 4) {
        void checkUsername(form.username);
      } else {
        setUsernameStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.username, checkUsername]);

  const nameLiveError = useMemo(() => {
    if (!form.name.trim()) return undefined;
    const name = normalizeFullName(form.name);
    if (!isValidFullName(name)) return FULL_NAME_INCOMPLETE_MESSAGE;
    if (name.length > 120) return "Nome deve ter no máximo 120 caracteres.";
    return undefined;
  }, [form.name]);

  const emailLiveFeedback = useMemo(() => getEmailLiveFeedback(form.email), [form.email]);

  const phoneLiveFeedback = useMemo(
    () => getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined),
    [form.phone, phoneCountry, brazilDdd]
  );

  const birthDateBounds = useMemo(() => getBirthDateBounds(), []);

  const birthDateLiveError = useMemo(() => {
    if (!form.birthDate) return undefined;
    return validateBirthDate(form.birthDate);
  }, [form.birthDate]);

  const canSubmit = acceptTerms && acceptPrivacy && !loading;

  function validatePersonalStep(): FieldErrors {
    const errors: FieldErrors = {};
    const name = normalizeFullName(form.name);
    if (!isValidFullName(name)) {
      errors.name = FULL_NAME_INCOMPLETE_MESSAGE;
    } else if (name.length > 120) {
      errors.name = "Nome deve ter no máximo 120 caracteres.";
    }

    const email = form.email.trim().toLowerCase();
    if (!isValidRegistrationEmail(email)) {
      errors.email = EMAIL_INVALID_MESSAGE;
    }

    if (phoneCountry === "BR") {
      if (!brazilDdd) {
        errors.phone = BR_DDD_REQUIRED_MESSAGE;
      } else if (!form.phone.trim()) {
        errors.phone = BR_PHONE_INVALID_MESSAGE;
      } else if (!phoneLiveFeedback.valid) {
        errors.phone = phoneLiveFeedback.message ?? BR_PHONE_INVALID_MESSAGE;
      }
    } else if (!form.phone.trim()) {
      errors.phone = PHONE_INVALID_MESSAGE;
    } else if (!phoneLiveFeedback.valid) {
      errors.phone = phoneLiveFeedback.message ?? PHONE_INVALID_MESSAGE;
    }

    if (!form.gender) {
      errors.gender = GENDER_VALIDATION_MESSAGE;
    } else if (form.gender === "OUTRO" && form.genderOther.trim().length < 2) {
      errors.genderOther = "Informe seu gênero.";
    }

    const username = form.username.trim();
    if (!USERNAME_PATTERN.test(username)) {
      errors.username = "Use 4–30 caracteres: letras, números, _ e .";
    } else if (usernameStatus === "taken") {
      errors.username = "Este nome de usuário já está em uso.";
    }

    if (!form.birthDate) {
      errors.birthDate = "Data de nascimento obrigatória.";
    } else {
      const birthError = validateBirthDate(form.birthDate);
      if (birthError) errors.birthDate = birthError;
    }

    return errors;
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errors = validatePersonalStep();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (usernameStatus === "checking") {
      setError("Aguarde a verificação do nome de usuário.");
      return;
    }
    setStep("security");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTermsError("");

    if (!acceptTerms || !acceptPrivacy) {
      setTermsError(CLIENT_LEGAL_ACCEPTANCE_MESSAGE);
      setLoading(false);
      return;
    }

    setStep("conclusion");

    if (form.password !== form.confirmPassword) {
      setError(PASSWORD_MISMATCH_MESSAGE);
      setStep("security");
      setLoading(false);
      return;
    }

    const pwdCheck = validateStrongPassword(form.password, passwordContext);
    if (!pwdCheck.valid) {
      setError(pwdCheck.error ?? "Senha não atende aos requisitos de segurança.");
      setStep("security");
      setLoading(false);
      return;
    }

    const normalizedPhone = resolveRegistrationPhoneE164(
      form.phone,
      phoneCountry,
      phoneCountry === "BR" ? brazilDdd : undefined
    );
    if (!normalizedPhone) {
      setError(PHONE_INVALID_MESSAGE);
      setStep("personal");
      setLoading(false);
      return;
    }

    const payload = {
      role: "CLIENT" as const,
      name: normalizeFullName(form.name),
      email: form.email.trim().toLowerCase(),
      phone: normalizedPhone,
      gender: form.gender,
      genderOther: form.gender === "OUTRO" ? form.genderOther.trim() : undefined,
      username: form.username.trim().toLowerCase(),
      birthDate: form.birthDate,
      password: form.password,
      confirmPassword: form.confirmPassword,
      acceptTerms: true,
      acceptPrivacy: true,
    };

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
        setStep("security");
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.data?.user?.role ? dashboardPathForRole(data.data.user.role) : "/dashboard");
      const sessionReady = await confirmSessionCookie();
      if (!sessionReady) {
        setError("Conta criada, mas a sessão não foi iniciada. Tente entrar com seu e-mail e senha.");
        setStep("security");
        return;
      }
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor.");
      setStep("security");
    } finally {
      setLoading(false);
    }
  }

  const formBody = (
    <>
      <RegisterProgress current={step} />

      {step === "personal" && (
          <form onSubmit={handleNextStep} className="mx-auto w-full max-w-lg space-y-4" noValidate>
            <AccessibleField
              id="client-name"
              label="Nome Completo"
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder="Digite seu nome completo"
              required
              error={fieldErrors.name ?? nameLiveError}
              onBlur={() => setField("name", normalizeFullName(form.name))}
            />

            <AccessibleField
              id="client-email"
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(v) => setField("email", v)}
              placeholder="Digite seu e-mail"
              required
              error={fieldErrors.email ?? (emailLiveFeedback.message && !emailLiveFeedback.valid ? emailLiveFeedback.message : undefined)}
              success={emailLiveFeedback.valid ? emailLiveFeedback.message : undefined}
              onBlur={() => setField("email", form.email.trim().toLowerCase())}
            />

            <InternationalPhoneField
              id="client-phone"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              brazilDdd={brazilDdd}
              onBrazilDddChange={setBrazilDdd}
              required
              error={
                fieldErrors.phone ??
                (phoneLiveFeedback.message && !phoneLiveFeedback.valid ? phoneLiveFeedback.message : undefined)
              }
            />

            <RegisterGenderSelector
              value={form.gender}
              onChange={(v) => setField("gender", v)}
              error={fieldErrors.gender}
            />

            {form.gender === "OUTRO" && (
              <AccessibleField
                id="client-gender-other"
                label="Informe seu gênero"
                value={form.genderOther}
                onChange={(v) => setField("genderOther", v)}
                placeholder="Informe seu gênero"
                required
                error={fieldErrors.genderOther}
              />
            )}

            <div>
              <label htmlFor="client-username" className="text-sm font-medium">
                Nome de Usuário *
              </label>
              <Input
                id="client-username"
                type="text"
                value={form.username}
                onChange={(e) => setField("username", e.target.value.replace(/[^a-zA-Z0-9_.]/g, ""))}
                placeholder="Digite seu nome de usuário"
                required
                maxLength={30}
                className="mt-1"
                aria-label="Nome de usuário"
                aria-describedby="client-username-status"
                aria-invalid={!!fieldErrors.username || usernameStatus === "taken" || usernameStatus === "invalid"}
              />
              {form.username.trim().length >= 4 && (
                <p
                  id="client-username-status"
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs font-medium",
                    usernameStatus === "available" && "text-green-700",
                    usernameStatus === "taken" && "text-red-600",
                    usernameStatus === "checking" && "text-muted-foreground",
                    usernameStatus === "invalid" && "text-red-600"
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {usernameStatus === "checking" && "Verificando disponibilidade..."}
                  {usernameStatus === "available" && (
                    <>
                      <Check className="h-3 w-3" aria-hidden /> Disponível
                    </>
                  )}
                  {usernameStatus === "taken" && (
                    <>
                      <X className="h-3 w-3" aria-hidden /> Já utilizado
                    </>
                  )}
                  {usernameStatus === "invalid" && "Formato inválido"}
                </p>
              )}
              {fieldErrors.username && (
                <p id="client-username-error" className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <AccessibleField
              id="client-birthdate"
              label="Data de Nascimento"
              type="date"
              value={form.birthDate}
              onChange={(v) => setField("birthDate", v)}
              required
              error={fieldErrors.birthDate ?? birthDateLiveError}
              min={birthDateBounds.min}
              max={birthDateBounds.max}
            />

            <Button type="submit" className="w-full">
              Continuar para segurança
            </Button>
          </form>
        )}

        {step === "security" && (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-5" noValidate>
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-ecopet-dark-card">
              <h2 className="font-display text-base font-semibold text-ecopet-dark dark:text-white">
                Defina sua senha
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Use uma senha forte com letras, números e símbolos. Evite dados pessoais e sequências óbvias.
              </p>
              <div className="mt-4 space-y-4">
                <FoundationPasswordField
                  id="client-password"
                  label="Senha"
                  value={form.password}
                  onChange={(v) => setField("password", v)}
                  context={passwordContext}
                  required
                  showRecommendations
                />
                <FoundationConfirmPasswordField
                  id="client-confirm-password"
                  label="Confirmar Senha"
                  value={form.confirmPassword}
                  password={form.password}
                  onChange={(v) => setField("confirmPassword", v)}
                  required
                />
              </div>
            </div>

            <ClientLegalAcceptance
              acceptTerms={acceptTerms}
              acceptPrivacy={acceptPrivacy}
              onAcceptTermsChange={(v) => {
                setAcceptTerms(v);
                setTermsError("");
              }}
              onAcceptPrivacyChange={(v) => {
                setAcceptPrivacy(v);
                setTermsError("");
              }}
              error={termsError}
            />

            {error && (
              <p id="client-register-error" className="text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("personal")}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSubmit}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        )}

        {step === "conclusion" && loading && (
          <p className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
            Finalizando seu cadastro...
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            Entrar
          </Link>
        </p>
    </>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader>
        <CardTitle>Criar conta — Cliente</CardTitle>
        <CardDescription>Preencha seus dados para acessar o EcoPet.</CardDescription>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}

function AccessibleField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
  success,
  maxLength,
  inputMode,
  onBlur,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  success?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text" | "email";
  onBlur?: () => void;
  min?: string;
  max?: string;
}) {
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const describedBy = [error ? errorId : null, success ? successId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        min={min}
        max={max}
        inputMode={inputMode}
        className={cn("mt-1", error && "border-red-500", success && !error && "border-green-500")}
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={!!error}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {success && !error && (
        <p id={successId} className="mt-1 text-sm text-green-700" role="status" aria-live="polite">
          {success}
        </p>
      )}
    </div>
  );
}
