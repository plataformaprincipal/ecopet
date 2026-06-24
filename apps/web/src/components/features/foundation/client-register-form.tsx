"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
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
import { StepValidationFeedback } from "@/components/features/foundation/step-validation-feedback";
import { collectUniqueErrorMessages, duplicateRegistrationError } from "@/lib/registration/collect-step-errors";
import { useAuthMessages } from "@/lib/i18n/use-auth-messages";

type Step = "personal" | "security" | "conclusion";

type FieldErrors = Record<string, string>;

import {
  isValidUsername,
  normalizeUsername,
  sanitizeUsernameInput,
} from "@/lib/validation/username";

export function ClientRegisterForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const { t, tv, tpwError, tApi, validation: v } = useAuthMessages();
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
  const [stepFeedback, setStepFeedback] = useState<string[]>([]);

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
    setStepFeedback([]);
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
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setUsernameStatus(normalized.length > 0 ? "invalid" : "idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(normalized)}`);
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
      if (form.username.trim().length >= 3) {
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
    if (!isValidFullName(name)) return v.fullNameIncomplete;
    if (name.length > 120) return v.nameTooLong;
    return undefined;
  }, [form.name, v.fullNameIncomplete, v.nameTooLong]);

  const emailLiveFeedback = useMemo(() => getEmailLiveFeedback(form.email), [form.email]);

  const phoneLiveFeedback = useMemo(
    () => getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined),
    [form.phone, phoneCountry, brazilDdd]
  );

  const birthDateBounds = useMemo(() => getBirthDateBounds(), []);

  const birthDateLiveError = useMemo(() => {
    if (!form.birthDate) return undefined;
    const err = validateBirthDate(form.birthDate);
    return err ? tv(err) : undefined;
  }, [form.birthDate, tv]);

  const canSubmit = acceptTerms && acceptPrivacy && !loading;

  function validatePersonalStep(): FieldErrors {
    const errors: FieldErrors = {};
    const name = normalizeFullName(form.name);
    if (!isValidFullName(name)) {
      errors.name = v.fullNameIncomplete;
    } else if (name.length > 120) {
      errors.name = v.nameTooLong;
    }

    const email = form.email.trim().toLowerCase();
    if (!isValidRegistrationEmail(email)) {
      errors.email = v.emailInvalid;
    }

    if (phoneCountry === "BR") {
      if (!brazilDdd) {
        errors.phone = v.brDddRequired;
      } else if (!form.phone.trim()) {
        errors.phone = v.brPhoneInvalid;
      } else if (!phoneLiveFeedback.valid) {
        errors.phone = tv(phoneLiveFeedback.message) ?? v.brPhoneInvalid;
      }
    } else if (!form.phone.trim()) {
      errors.phone = v.phoneInvalid;
    } else if (!phoneLiveFeedback.valid) {
      errors.phone = tv(phoneLiveFeedback.message) ?? v.phoneInvalid;
    }

    if (!form.gender) {
      errors.gender = v.genderRequired;
    } else if (form.gender === "OUTRO" && form.genderOther.trim().length < 2) {
      errors.genderOther = v.genderSpecify;
    }

    const username = normalizeUsername(form.username);
    if (!isValidUsername(username)) {
      errors.username = v.usernameFormat;
    } else if (usernameStatus === "taken") {
      Object.assign(errors, duplicateRegistrationError());
    }

    if (!form.birthDate) {
      errors.birthDate = v.birthDateRequired;
    } else {
      const birthError = validateBirthDate(form.birthDate);
      if (birthError) errors.birthDate = tv(birthError) ?? birthError;
    }

    return errors;
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (usernameStatus === "checking") {
      setStepFeedback([t("auth.client.usernameCheckingWait")]);
      return;
    }
    const errors = validatePersonalStep();
    const messages = collectUniqueErrorMessages(errors).map((m) => tv(m));
    setStepFeedback(messages);
    if (messages.length > 0) {
      setFieldErrors(errors);
      return;
    }
    setStepFeedback([]);
    setStep("security");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTermsError("");

    const securityErrors: FieldErrors = {};
    if (!acceptTerms || !acceptPrivacy) {
      setTermsError(CLIENT_LEGAL_ACCEPTANCE_MESSAGE);
      securityErrors.legal = t("auth.terms.acceptanceRequired");
    }
    if (form.password !== form.confirmPassword) {
      securityErrors.confirmPassword = v.passwordMismatch;
    }
    const pwdCheck = validateStrongPassword(form.password, passwordContext);
    if (!pwdCheck.valid) {
      securityErrors.password = pwdCheck.errorId
        ? tpwError(pwdCheck.errorId)
        : v.passwordWeak;
    }
    const messages = collectUniqueErrorMessages(securityErrors).map((m) => tv(m));
    if (messages.length > 0) {
      setStepFeedback(messages);
      setLoading(false);
      return;
    }
    setStepFeedback([]);

    setStep("conclusion");

    const normalizedPhone = resolveRegistrationPhoneE164(
      form.phone,
      phoneCountry,
      phoneCountry === "BR" ? brazilDdd : undefined
    );
    if (!normalizedPhone) {
      setError(v.phoneInvalid);
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
            ? tv(mapRegisterConflictMessage(code, message))
            : tApi(message, code) || t("auth.client.registerError");
        setError(msg);
        setStep("security");
        return;
      }
      const redirectTo =
        data.data?.redirectTo ??
        (data.data?.user?.role ? dashboardPathForRole(data.data.user.role) : "/dashboard");
      const sessionReady = await confirmSessionCookie();
      if (!sessionReady) {
        setError(t("auth.client.sessionError"));
        setStep("security");
        return;
      }
      router.push(redirectTo);
      notifySessionChanged();
      router.refresh();
    } catch {
      setError(t("auth.login.connectionError"));
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
              label={t("auth.client.fullName")}
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder={t("auth.client.fullNamePlaceholder")}
              required
              error={fieldErrors.name ?? nameLiveError}
              onBlur={() => setField("name", normalizeFullName(form.name))}
            />

            <AccessibleField
              id="client-email"
              label={t("auth.register.fields.email")}
              type="email"
              value={form.email}
              onChange={(v) => setField("email", v)}
              placeholder={t("auth.client.emailPlaceholder")}
              required
              error={fieldErrors.email ?? (emailLiveFeedback.message && !emailLiveFeedback.valid ? tv(emailLiveFeedback.message) : undefined)}
              success={emailLiveFeedback.valid ? tv(emailLiveFeedback.message) : undefined}
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
                (phoneLiveFeedback.message && !phoneLiveFeedback.valid ? tv(phoneLiveFeedback.message) : undefined)
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
                label={t("auth.gender.specify")}
                value={form.genderOther}
                onChange={(v) => setField("genderOther", v)}
                placeholder={t("auth.gender.specifyPlaceholder")}
                required
                error={fieldErrors.genderOther}
              />
            )}

            <div>
              <label htmlFor="client-username" className="text-sm font-medium">
                {t("auth.client.username")} *
              </label>
              <Input
                id="client-username"
                type="text"
                value={form.username}
                onChange={(e) => setField("username", sanitizeUsernameInput(e.target.value))}
                placeholder={t("auth.client.usernamePlaceholder")}
                required
                maxLength={30}
                className="mt-1"
                aria-label={t("auth.client.username")}
                aria-describedby="client-username-status"
                aria-invalid={!!fieldErrors.username || usernameStatus === "taken" || usernameStatus === "invalid"}
              />
              {form.username.trim().length >= 3 && (
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
                  {usernameStatus === "checking" && t("auth.client.usernameChecking")}
                  {usernameStatus === "available" && (
                    <>
                      <Check className="h-3 w-3" aria-hidden /> {t("auth.client.usernameAvailable")}
                    </>
                  )}
                  {usernameStatus === "invalid" && v.usernameFormat}
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
              label={t("auth.client.birthDate")}
              type="date"
              value={form.birthDate}
              onChange={(v) => setField("birthDate", v)}
              required
              error={fieldErrors.birthDate ?? birthDateLiveError}
              min={birthDateBounds.min}
              max={birthDateBounds.max}
            />

            <Button type="submit" className="w-full">
              {t("auth.client.continueSecurity")}
            </Button>
            <StepValidationFeedback messages={stepFeedback} />
          </form>
        )}

        {step === "security" && (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-5" noValidate>
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-ecopet-dark-card">
              <h2 className="font-display text-base font-semibold text-ecopet-dark dark:text-white">
                {t("auth.client.passwordSectionTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("auth.client.passwordSectionHint")}
              </p>
              <div className="mt-4 space-y-4">
                <FoundationPasswordField
                  id="client-password"
                  label={t("auth.login.password")}
                  value={form.password}
                  onChange={(v) => setField("password", v)}
                  context={passwordContext}
                  required
                  showRecommendations
                />
                <FoundationConfirmPasswordField
                  id="client-confirm-password"
                  label={t("auth.client.confirmPassword")}
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
                {t("auth.client.back")}
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSubmit}>
                {loading ? t("auth.client.registering") : t("auth.client.register")}
              </Button>
            </div>
            <StepValidationFeedback messages={stepFeedback} />
          </form>
        )}

        {step === "conclusion" && loading && (
          <p className="text-center text-sm text-muted-foreground" role="status" aria-live="polite">
            {t("auth.client.finalize")}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            {t("auth.login.submit")}
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
        <CardTitle>{t("auth.client.title")}</CardTitle>
        <CardDescription>{t("auth.client.description")}</CardDescription>
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
