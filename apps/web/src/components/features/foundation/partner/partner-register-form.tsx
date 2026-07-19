"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CountryCode } from "libphonenumber-js";
import { Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileField } from "@/components/security/turnstile-field";
import { useTurnstile } from "@/hooks/use-turnstile";
import { TURNSTILE_ACTIONS } from "@/lib/turnstile/actions";
import { getTurnstilePublicConfig } from "@/lib/turnstile/config";
import { RegisterProgress } from "@/components/features/foundation/register-progress";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import { InternationalPhoneField } from "@/components/features/foundation/international-phone-field";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";
import { PartnerTypeSelector } from "@/components/features/foundation/partner/partner-type-selector";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";
import { PartnerLegalAcceptance,
  PARTNER_LEGAL_ACCEPTANCE_MESSAGE,
} from "@/components/features/foundation/partner/partner-legal-acceptance";
import { PartnerLogoUpload, type PartnerLogoValue } from "@/components/features/foundation/partner/partner-logo-upload";
import {
  PartnerDocumentationStep,
  type PartnerDocumentItem,
} from "@/components/features/foundation/partner/partner-documentation-step";
import {
  ACTIVITY_AREAS,
  CORPORATE_TYPES,
  DELIVERY_OPTIONS,
  OPERATION_MODES,
  PAYMENT_METHODS,
  PIX_KEY_TYPES,
  SERVICE_RADIUS_OPTIONS,
  STREET_TYPES,
  WEEKDAYS,
  BANK_OPTIONS,
  ACCOUNT_TYPES,
} from "@/lib/partner/constants";
import {
  INITIAL_PARTNER_FORM,
  PARTNER_DRAFT_KEY,
  formToRegisterPayload,
  type PartnerFormState,
} from "@/lib/partner/form-state";
import type { PartnerType } from "@/lib/partner/constants";
import {
  normalizeFullName,
  isValidFullName,
  FULL_NAME_INCOMPLETE_MESSAGE,
} from "@/lib/validation/full-name";
import {
  getEmailLiveFeedback,
  EMAIL_INVALID_MESSAGE,
} from "@/lib/validation/email";
import {
  getPhoneLiveFeedback,
  resolveRegistrationPhoneE164,
  BR_DDD_REQUIRED_MESSAGE,
  BR_PHONE_INVALID_MESSAGE,
  PHONE_INVALID_MESSAGE,
} from "@/lib/validation/international-phone";
import { validateActivityStartDate, getActivityStartDateBounds } from "@/lib/validation/activity-start-date";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { maskCpf, maskCnpj } from "@/schemas/validation/documents-shared";
import { validateCpfChecksum, validateCnpjChecksum, onlyDigits } from "@/schemas/validation/documents-shared";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { confirmSessionCookie } from "@/lib/auth/confirm-session";
import { notifySessionChanged } from "@/lib/auth/session-events";
import { mapRegisterConflictMessage, parseApiFailureError } from "@/lib/api-errors";
import {
  validateOperationSchedule,
  requiresOperationSchedule,
} from "@/lib/partner/operation-rules";
import { validateRequiredDocuments } from "@/lib/partner/document-validation";
import { uploadPartnerRegistrationAssets } from "@/lib/partner/post-register-assets";
import { CPF_NAME_MISMATCH_MESSAGE } from "@/lib/integrations/cpf/cpf-service";
import type { CnpjLookupResult } from "@/lib/integrations/cnpj/types";
import { cn } from "@/lib/utils";
import { StepValidationFeedback } from "@/components/features/foundation/step-validation-feedback";
import { collectUniqueErrorMessages, duplicateRegistrationError } from "@/lib/registration/collect-step-errors";
import { useDocumentAvailability } from "@/lib/registration/use-document-availability";
import { usePartnerRegisterCopy } from "@/lib/i18n/use-register-copy";
import { isValidUsername, normalizeUsername, sanitizeUsernameInput } from "@/lib/validation/username";

type StepId =
  | "type"
  | "legal"
  | "corporate"
  | "professional"
  | "operation"
  | "documentation"
  | "financial"
  | "security"
  | "success";

function stepLabels(
  partnerType: PartnerType | null,
  steps: ReturnType<typeof usePartnerRegisterCopy>["p"]["steps"]
): { id: StepId; label: string }[] {
  if (partnerType === "CORPORATE") {
    return [
      { id: "type", label: steps.type },
      { id: "legal", label: steps.legal },
      { id: "corporate", label: steps.corporate },
      { id: "professional", label: steps.professional },
      { id: "operation", label: steps.operation },
      { id: "documentation", label: steps.documentation },
      { id: "financial", label: steps.financial },
      { id: "security", label: steps.security },
    ];
  }
  return [
    { id: "type", label: steps.type },
    { id: "legal", label: steps.legal },
    { id: "professional", label: steps.professional },
    { id: "operation", label: steps.operation },
    { id: "documentation", label: steps.documentation },
    { id: "financial", label: steps.financial },
    { id: "security", label: steps.security },
  ];
}

export function PartnerRegisterForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const { t, tv, tpwError, tApi, validation: v, p } = usePartnerRegisterCopy();
  const [step, setStep] = useState<StepId>("type");
  const [form, setForm] = useState<PartnerFormState>(INITIAL_PARTNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("BR");
  const [brazilDdd, setBrazilDdd] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [logo, setLogo] = useState<PartnerLogoValue>({ previewUrl: null, file: null, alt: "" });
  const [documents, setDocuments] = useState<PartnerDocumentItem[]>([]);
  const [docsError, setDocsError] = useState("");
  const [stepFeedback, setStepFeedback] = useState<string[]>([]);
  const [cpfSyncMessage, setCpfSyncMessage] = useState("");
  const [cpfNameMismatch, setCpfNameMismatch] = useState(false);
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false);
  const [cnpjWarnings, setCnpjWarnings] = useState<string[]>([]);
  const [cnpjLookupInfo, setCnpjLookupInfo] = useState("");
  const turnstileEnabled = useMemo(() => getTurnstilePublicConfig().enabled, []);
  const turnstile = useTurnstile({
    action: TURNSTILE_ACTIONS.REGISTER_PARTNER,
    required: turnstileEnabled,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PARTNER_DRAFT_KEY);
      if (raw) setForm({ ...INITIAL_PARTNER_FORM, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PARTNER_DRAFT_KEY, JSON.stringify({ ...form, password: "", confirmPassword: "" }));
    } catch {
      /* ignore */
    }
  }, [form]);

  const steps = stepLabels(form.partnerType, p.steps);
  const currentIndex = steps.findIndex((s) => s.id === step);
  const progressSteps = steps.map((s) => s.label);
  const canSubmitPartner =
    acceptTerms && acceptPrivacy && !loading && (!turnstileEnabled || turnstile.isVerified);

  const passwordContext = useMemo(
    () => ({
      email: form.email.trim().toLowerCase(),
      name: normalizeFullName(form.name),
      username: form.username.toLowerCase(),
      phone: form.phone,
    }),
    [form.email, form.name, form.username, form.phone]
  );

  const cpfAvailability = useDocumentAvailability(
    "cpf",
    form.partnerType === "AUTONOMOUS" ? form.cpf : ""
  );
  const cnpjAvailability = useDocumentAvailability(
    "cnpj",
    form.partnerType === "CORPORATE" ? form.cnpj : ""
  );

  function patch(partial: Partial<PartnerFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setFieldErrors({});
    setStepFeedback([]);
  }

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
      setUsernameStatus(data.data?.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void checkUsername(form.username), 400);
    return () => clearTimeout(t);
  }, [form.username, checkUsername]);

  useEffect(() => {
    if (form.partnerType !== "AUTONOMOUS") return;
    const cpfDigits = onlyDigits(form.cpf);
    if (!validateCpfChecksum(cpfDigits) || !isValidFullName(form.name)) {
      setCpfSyncMessage("");
      setCpfNameMismatch(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/integrations/cpf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpfDigits, name: form.name }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCpfSyncMessage(data.data.message ?? "");
          setCpfNameMismatch(data.data.nameMatch === false);
        }
      } catch {
        /* consulta opcional */
      }
    }, 600);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [form.cpf, form.name, form.partnerType]);

  const lookupCnpj = useCallback(async (cnpjMasked: string) => {
    const digits = onlyDigits(cnpjMasked);
    if (digits.length !== 14 || !validateCnpjChecksum(digits)) {
      setCnpjWarnings([]);
      setCnpjLookupInfo("");
      return;
    }
    setCnpjLookupLoading(true);
    setCnpjWarnings([]);
    setCnpjLookupInfo("");
    try {
      const res = await fetch(`/api/integrations/cnpj?cnpj=${encodeURIComponent(digits)}`);
      const data = await res.json();
      if (!data.success) return;
      if (!data.data.found) {
        setCnpjLookupInfo(data.data.message ?? "CNPJ não encontrado na consulta.");
        return;
      }
      const result = data.data.data as CnpjLookupResult;
      setCnpjWarnings(data.data.warnings ?? result.warnings ?? []);
      setForm((prev) => ({
        ...prev,
        businessName: result.businessName || prev.businessName,
        legalName: result.legalName || prev.legalName,
        cnpjDetails: result,
        activityStartDate: result.openingDate?.slice(0, 10) || prev.activityStartDate,
        addressDetails: {
          ...prev.addressDetails,
          zipCode: result.address.zipCode
            ? `${result.address.zipCode.slice(0, 5)}-${result.address.zipCode.slice(5)}`
            : prev.addressDetails.zipCode,
          street: result.address.street || prev.addressDetails.street,
          number: result.address.number || prev.addressDetails.number,
          district: result.address.district || prev.addressDetails.district,
          city: result.address.city || prev.addressDetails.city,
          state: result.address.state || prev.addressDetails.state,
          complement: result.address.complement || prev.addressDetails.complement,
        },
      }));
      setCnpjLookupInfo(`Situação: ${result.registrationStatus || "consultada"}. Dados preenchidos automaticamente — revise se necessário.`);
    } catch {
      setCnpjLookupInfo("Consulta de CNPJ indisponível no momento. Preencha manualmente.");
    } finally {
      setCnpjLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.partnerType !== "CORPORATE" || step !== "corporate") return;
    const t = setTimeout(() => void lookupCnpj(form.cnpj), 700);
    return () => clearTimeout(t);
  }, [form.cnpj, form.partnerType, step, lookupCnpj]);

  function validateStep(current: StepId): Record<string, string> {
    const errors: Record<string, string> = {};

    if (current === "type") {
      if (!form.partnerType) errors.partnerType = p.validation.partnerTypeRequired;
    }

    if (current === "legal") {
      if (!isValidFullName(form.name)) errors.name = v.fullNameIncomplete;
      const cpfDigits = onlyDigits(form.cpf);
      if (form.partnerType === "AUTONOMOUS") {
        if (!validateCpfChecksum(cpfDigits)) errors.cpf = v.cpfInvalid;
        else if (cpfAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      }
      if (!getEmailLiveFeedback(form.email).valid) errors.email = v.emailInvalid;
      const phoneFb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
      if (!phoneFb.valid) errors.phone = phoneFb.message ?? v.phoneInvalid;
      if (!isValidUsername(form.username)) errors.username = p.validation.usernameInvalid;
      if (usernameStatus === "taken") Object.assign(errors, duplicateRegistrationError());
      const dateErr = validateActivityStartDate(form.activityStartDate);
      if (dateErr) errors.activityStartDate = tv(dateErr) ?? dateErr;
    }

    if (current === "corporate" && form.partnerType === "CORPORATE") {
      if (!validateCnpjChecksum(onlyDigits(form.cnpj))) errors.cnpj = v.cnpjInvalid;
      else if (cnpjAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      if (form.businessName.trim().length < 2) errors.businessName = p.validation.businessNameRequired;
      if (form.legalName.trim().length < 2) errors.legalName = p.validation.legalNameRequired;
      if (!form.corporateType) errors.corporateType = p.validation.corporateTypeRequired;
      if (form.corporateType === "Outro" && form.corporateTypeOther.trim().length < 2) {
        errors.corporateTypeOther = p.validation.corporateTypeOtherRequired;
      }
    }

    if (current === "professional") {
      if (form.partnerType === "AUTONOMOUS" && form.professionalName.trim().length < 2) {
        errors.professionalName = p.validation.businessNameRequired;
      }
      if (!form.activityAreas.length) errors.activityAreas = p.validation.activityAreasRequired;
      if (form.activityAreas.includes("OUTROS") && form.activityAreasOther.trim().length < 3) {
        errors.activityAreasOther = p.validation.activityAreasOtherRequired;
      }
      if (form.businessDescription.length < 80) errors.businessDescription = p.validation.descriptionTooShort;
      if (form.businessDescription.length > 800) errors.businessDescription = p.validation.descriptionTooLong;
      const a = form.addressDetails;
      if (!a.zipCode || a.zipCode.replace(/\D/g, "").length !== 8) errors["addressDetails.zipCode"] = p.validation.zipCodeInvalid;
      if (!a.streetType) errors["addressDetails.streetType"] = p.validation.streetTypeRequired;
      if (a.streetType === "Outro" && !a.streetTypeOther.trim()) errors["addressDetails.streetTypeOther"] = p.validation.streetTypeOtherRequired;
      if (!a.street.trim()) errors["addressDetails.street"] = p.validation.streetRequired;
      if (!a.number.trim()) errors["addressDetails.number"] = p.validation.numberRequired;
      if (!a.district.trim()) errors["addressDetails.district"] = p.validation.districtRequired;
      if (!a.city.trim()) errors["addressDetails.city"] = p.validation.cityRequired;
      if (a.state.length !== 2) errors["addressDetails.state"] = p.validation.stateRequired;
    }

    if (current === "operation") {
      if (!form.operationModes.length) errors.operationModes = p.validation.operationModesRequired;
      const scheduleErr = validateOperationSchedule(
        form.operationModes,
        form.weekdays,
        form.openTime,
        form.closeTime
      );
      if (scheduleErr) {
        errors[scheduleErr.field ?? "openTime"] = scheduleErr.message;
      }
      if (!form.serviceRadius) errors.serviceRadius = p.validation.serviceRadiusRequired;
    }

    if (current === "documentation" && form.partnerType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredDocuments(form.partnerType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        errors.documentation = docCheck.message ?? "";
      } else {
        setDocsError("");
      }
    }

    if (current === "security" && form.partnerType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredDocuments(form.partnerType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        errors.documentation = docCheck.message ?? "";
      }
    }

    if (current === "financial") {
      if (!form.paymentMethods.length) errors.paymentMethods = p.validation.paymentMethodsRequired;
      if (form.paymentMethods.includes("Pix") && (!form.pixKeyType || !form.pixKey.trim())) {
        errors.pixKey = p.validation.pixKeyRequired;
      }
      if (form.paymentMethods.includes("Transferência bancária")) {
        if (!form.bankName || !form.agency || !form.accountNumber || !form.accountHolder) {
          errors.bankName = p.validation.bankRequired;
        }
        if (form.bankName === "Outros" && !form.bankNameOther.trim()) errors.bankNameOther = p.validation.bankOtherRequired;
      }
    }

    if (current === "security") {
      const pwd = validateStrongPassword(form.password, passwordContext);
      if (!pwd.valid) {
        errors.password = pwd.errorId ? tpwError(pwd.errorId) : p.validation.passwordInvalid;
      }
      if (form.password !== form.confirmPassword) errors.confirmPassword = v.passwordMismatch;
      if (!acceptTerms || !acceptPrivacy) setTermsError(PARTNER_LEGAL_ACCEPTANCE_MESSAGE);
      else setTermsError("");
      if (!acceptTerms || !acceptPrivacy) errors.legal = t("auth.terms.acceptanceRequired");
    }

    setFieldErrors(errors);
    return errors;
  }

  function goNext() {
    if (form.partnerType === "AUTONOMOUS" && step === "legal" && cpfAvailability === "checking") {
      setStepFeedback([p.validation.waitCpf]);
      return;
    }
    if (form.partnerType === "CORPORATE" && step === "corporate" && cnpjAvailability === "checking") {
      setStepFeedback([p.validation.waitCnpj]);
      return;
    }
    if (step === "legal" && usernameStatus === "checking") {
      setStepFeedback([p.validation.waitUsername]);
      return;
    }

    const errors = validateStep(step);
    const messages = collectUniqueErrorMessages(errors).map((m) => tv(m));
    setStepFeedback(messages);
    if (messages.length > 0) return;

    const idx = steps.findIndex((s) => s.id === step);
    if (idx < steps.length - 1) setStep(steps[idx + 1].id);
  }

  function goBack() {
    const idx = steps.findIndex((s) => s.id === step);
    if (idx > 0) setStep(steps[idx - 1].id);
  }

  async function handleSubmit() {
    const errors = validateStep("security");
    const messages = collectUniqueErrorMessages(errors).map((m) => tv(m));
    setStepFeedback(messages);
    if (messages.length > 0) return;
    if (form.partnerType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredDocuments(form.partnerType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        setError(docCheck.message ?? p.validation.docsPending);
        return;
      }
    }
    setLoading(true);
    setError("");
    const phoneE164 = resolveRegistrationPhoneE164(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
    if (!phoneE164) {
      setError(phoneCountry === "BR" && !brazilDdd ? v.brDddRequired : v.phoneInvalid);
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...formToRegisterPayload(form, phoneE164, {
          providedDocumentTypes: documents.filter((d) => d.status === "uploaded").map((d) => d.type),
        }),
        turnstileToken: turnstile.consumeToken(),
        turnstileAction: TURNSTILE_ACTIONS.REGISTER_PARTNER,
      };
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        const { code, message } = parseApiFailureError(data);
        setError(res.status === 409 ? mapRegisterConflictMessage(code, message) : tApi(message, code) || p.validation.registerError);
        turnstile.reset();
        return;
      }
      localStorage.removeItem(PARTNER_DRAFT_KEY);
      setStep("success");
      await confirmSessionCookie();
      notifySessionChanged();
      await uploadPartnerRegistrationAssets({
        logoFile: logo.file,
        logoAlt: logo.alt || form.logoAlt,
        documents: documents.map((d) => ({
          id: d.id,
          type: d.type,
          typeLabel: d.typeLabel,
          file: d.file,
        })),
        cnpjDetails: form.cnpjDetails,
      });
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  const activityBounds = getActivityStartDateBounds();
  const filteredAreas = ACTIVITY_AREAS.filter((a) =>
    p.activityArea(a.value).toLowerCase().includes(areaFilter.toLowerCase())
  );

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold">{p.success.title}</h2>
        <p className="text-sm text-muted-foreground">{p.success.description}</p>
        <Button className="w-full" onClick={() => router.push(dashboardPathForRole("PARTNER"))}>
          {p.success.dashboard}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full space-y-6", embedded ? "" : "max-w-3xl py-4")}>
      <RegisterProgress steps={progressSteps} currentIndex={Math.max(0, currentIndex)} />

      {step === "type" && (
        <PartnerTypeSelector
          value={form.partnerType}
          onChange={(v) => patch({ partnerType: v })}
          error={fieldErrors.partnerType}
        />
      )}

      {step === "legal" && (
        <section className="space-y-4" aria-labelledby="partner-legal-step">
          <h2 id="partner-legal-step" className="text-lg font-semibold">
            {p.sections.legal}
          </h2>
          <Field label={p.fields.responsibleName} id="partner-name" value={form.name} onChange={(v) => patch({ name: v })} error={fieldErrors.name} required hint={v.fullNameIncomplete} tv={tv} />
          {form.partnerType === "AUTONOMOUS" && (
            <>
              <Field label={p.fields.cpf} id="partner-cpf" value={form.cpf} onChange={(v) => patch({ cpf: maskCpf(v) })} error={fieldErrors.cpf} required tv={tv} />
              {cpfSyncMessage && !cpfNameMismatch && (
                <p className="text-xs text-muted-foreground" aria-live="polite">{cpfSyncMessage}</p>
              )}
              {cpfNameMismatch && (
                <p className="text-sm text-amber-700" role="status" aria-live="polite">{tv(CPF_NAME_MISMATCH_MESSAGE)}</p>
              )}
            </>
          )}
          <Field label={p.fields.email} id="partner-email" type="email" value={form.email} onChange={(v) => patch({ email: v })} error={fieldErrors.email} required autoComplete="email" tv={tv} />
          <InternationalPhoneField
            id="partner-phone"
            value={form.phone}
            onChange={(v) => patch({ phone: v })}
            country={phoneCountry}
            onCountryChange={setPhoneCountry}
            brazilDdd={brazilDdd}
            onBrazilDddChange={setBrazilDdd}
            required
            error={fieldErrors.phone}
          />
          <div>
            <Field label={p.fields.username} id="partner-username" value={form.username} onChange={(v) => patch({ username: sanitizeUsernameInput(v) })} error={fieldErrors.username} required autoComplete="username" tv={tv} />
            {usernameStatus === "available" && <p className="mt-1 text-xs text-green-700">{p.hints.usernameAvailable}</p>}
          </div>
          <Field label={p.fields.activityStart} id="partner-activity-start" type="date" value={form.activityStartDate} onChange={(v) => patch({ activityStartDate: v })} error={fieldErrors.activityStartDate} required min={activityBounds.min} max={activityBounds.max} tv={tv} />
        </section>
      )}

      {step === "corporate" && form.partnerType === "CORPORATE" && (
        <section className="space-y-4" aria-labelledby="partner-corporate-step">
          <h2 id="partner-corporate-step" className="text-lg font-semibold">
            {p.sections.corporate}
          </h2>
          <Field label={p.fields.cnpj} id="partner-cnpj" value={form.cnpj} onChange={(v) => patch({ cnpj: maskCnpj(v) })} error={fieldErrors.cnpj} required tv={tv} />
          {cnpjLookupLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {p.cnpj.loading}
            </p>
          )}
          {cnpjWarnings.map((w) => (
            <p key={w} className="text-sm text-amber-700" role="status" aria-live="polite">{w}</p>
          ))}
          {cnpjLookupInfo && !cnpjLookupLoading && (
            <p className="text-xs text-emerald-800" aria-live="polite">{cnpjLookupInfo}</p>
          )}
          <Field label={p.fields.businessName} id="partner-business-name" value={form.businessName} onChange={(v) => patch({ businessName: v })} error={fieldErrors.businessName} required tv={tv} />
          <Field label={p.fields.legalName} id="partner-legal-name" value={form.legalName} onChange={(v) => patch({ legalName: v })} error={fieldErrors.legalName} required tv={tv} />
          <div>
            <label htmlFor="partner-corporate-type" className="text-sm font-medium">{p.fields.corporateType} *</label>
            <select
              id="partner-corporate-type"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.corporateType}
              onChange={(e) => patch({ corporateType: e.target.value })}
              aria-invalid={!!fieldErrors.corporateType}
            >
              <option value="">{p.actions.select}</option>
              {CORPORATE_TYPES.map((t) => (
                <option key={t} value={t}>{p.corporateType(t)}</option>
              ))}
            </select>
            {fieldErrors.corporateType && <p className="mt-1 text-sm text-red-600" role="alert">{tv(fieldErrors.corporateType)}</p>}
          </div>
          {form.corporateType === "Outro" && (
            <Field label={p.fields.corporateTypeOther} id="partner-corporate-other" value={form.corporateTypeOther} onChange={(v) => patch({ corporateTypeOther: v })} error={fieldErrors.corporateTypeOther} required tv={tv} />
          )}
        </section>
      )}

      {step === "professional" && (
        <section className="space-y-6" aria-labelledby="partner-professional-step">
          <h2 id="partner-professional-step" className="text-lg font-semibold">
            {p.sections.professional}
          </h2>
          <PartnerLogoUpload
            value={logo}
            onChange={(v) => {
              setLogo(v);
              patch({ logoAlt: v.alt });
            }}
            businessName={
              form.partnerType === "AUTONOMOUS" ? form.professionalName : form.businessName
            }
            fieldId="partner-logo"
          />
          {form.partnerType === "AUTONOMOUS" && (
            <Field label={p.fields.professionalName} id="partner-prof-name" value={form.professionalName} onChange={(v) => patch({ professionalName: v })} error={fieldErrors.professionalName} required tv={tv} />
          )}
          <div>
            <label htmlFor="partner-area-search" className="text-sm font-medium">{p.fields.activityArea} *</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input id="partner-area-search" placeholder={p.fields.activityAreaSearch} value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="pl-9" />
            </div>
            <div className="mt-3">
              <PartnerSelectableCards
                name="activity-areas"
                legend={p.legends.activityAreas}
                options={filteredAreas.map((a) => ({ value: a.value, label: p.activityArea(a.value), icon: a.icon }))}
                value={form.activityAreas}
                onChange={(v) => patch({ activityAreas: v as string[] })}
                multiple
                columns={3}
                error={fieldErrors.activityAreas}
              />
            </div>
            {form.activityAreas.includes("OUTROS") && (
              <Field label={p.fields.activityAreaOther} id="partner-area-other" value={form.activityAreasOther} onChange={(v) => patch({ activityAreasOther: v })} error={fieldErrors.activityAreasOther} required tv={tv} />
            )}
          </div>
          <div>
            <label htmlFor="partner-description" className="text-sm font-medium">{p.fields.businessDescription} *</label>
            <textarea
              id="partner-description"
              className="mt-1 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              value={form.businessDescription}
              onChange={(e) => patch({ businessDescription: e.target.value })}
              maxLength={800}
              aria-describedby="partner-description-count"
              aria-invalid={!!fieldErrors.businessDescription}
            />
            <p id="partner-description-count" className="mt-1 text-xs text-muted-foreground">{p.hints.descriptionCount(form.businessDescription.length)}</p>
            {fieldErrors.businessDescription && <p className="mt-1 text-sm text-red-600" role="alert">{tv(fieldErrors.businessDescription)}</p>}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">{p.sections.address}</h3>
            <div>
              <label htmlFor="partner-street-type" className="text-sm font-medium">{p.fields.streetType} *</label>
              <select
                id="partner-street-type"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.addressDetails.streetType}
                onChange={(e) => patch({ addressDetails: { ...form.addressDetails, streetType: e.target.value } })}
              >
                {STREET_TYPES.map((t) => (
                  <option key={t} value={t}>{p.streetType(t)}</option>
                ))}
              </select>
            </div>
            {form.addressDetails.streetType === "Outro" && (
              <Field label={p.fields.streetTypeOther} id="partner-street-type-other" value={form.addressDetails.streetTypeOther} onChange={(v) => patch({ addressDetails: { ...form.addressDetails, streetTypeOther: v } })} error={fieldErrors["addressDetails.streetTypeOther"]} required tv={tv} />
            )}
            <AddressByCepField
              value={form.addressDetails}
              onChange={(addr) => patch({ addressDetails: { ...form.addressDetails, ...addr } })}
              errors={{
                zipCode: fieldErrors["addressDetails.zipCode"],
                street: fieldErrors["addressDetails.street"],
                number: fieldErrors["addressDetails.number"],
                district: fieldErrors["addressDetails.district"],
                city: fieldErrors["addressDetails.city"],
                state: fieldErrors["addressDetails.state"],
              }}
              idPrefix="partner-addr"
              title=""
              variant="plain"
            />
          </div>
        </section>
      )}

      {step === "operation" && (
        <section className="space-y-6" aria-labelledby="partner-operation-step">
          <h2 id="partner-operation-step" className="text-lg font-semibold">
            {p.sections.operation}
          </h2>
          <PartnerSelectableCards
            name="operation-modes"
            legend={p.legends.operation}
            options={OPERATION_MODES.map((m) => ({ value: m.value, label: p.operationMode(m.value) }))}
            value={form.operationModes}
            onChange={(v) => patch({ operationModes: v as string[] })}
            multiple
            error={fieldErrors.operationModes}
          />
          {form.operationModes.includes("BY_APPOINTMENT") && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {p.hints.byAppointment}
            </p>
          )}
          {form.operationModes.includes("EMERGENCY") && (
            <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">
              {p.hints.emergency}
            </p>
          )}
          {form.operationModes.includes("HOURS_24") && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {p.hints.hours24}
            </p>
          )}
          {requiresOperationSchedule(form.operationModes) && (
            <>
              <PartnerSelectableCards
                name="weekdays"
                legend={p.legends.weekdays}
                options={WEEKDAYS.map((d) => ({ value: d.value, label: p.weekday(d.value) }))}
                value={form.weekdays}
                onChange={(v) => patch({ weekdays: v as string[] })}
                multiple
                columns={3}
                error={fieldErrors.weekdays}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={p.fields.openTime} id="partner-open" type="time" value={form.openTime} onChange={(v) => patch({ openTime: v })} error={fieldErrors.openTime} required tv={tv} />
                <Field label={p.fields.closeTime} id="partner-close" type="time" value={form.closeTime} onChange={(v) => patch({ closeTime: v })} error={fieldErrors.closeTime} required tv={tv} />
              </div>
            </>
          )}
          <PartnerSelectableCards
            name="service-radius"
            legend={p.legends.serviceRadius}
            options={SERVICE_RADIUS_OPTIONS.map((r) => ({ value: r.value, label: p.serviceRadius(r.value) }))}
            value={form.serviceRadius}
            onChange={(v) => patch({ serviceRadius: v as string })}
            error={fieldErrors.serviceRadius}
            columns={1}
          />
          <PartnerSelectableCards
            name="delivery-options"
            legend={p.legends.delivery}
            options={DELIVERY_OPTIONS.map((d) => ({ value: d.value, label: p.deliveryOption(d.value) }))}
            value={form.deliveryOptions}
            onChange={(v) => patch({ deliveryOptions: v as string[] })}
            multiple
          />
          {(form.deliveryOptions.includes("DELIVERY") || form.deliveryOptions.includes("TELEBUS")) && (
            <Field label={p.fields.logisticsNotes} id="partner-logistics" value={form.logisticsNotes} onChange={(v) => patch({ logisticsNotes: v })} placeholder={p.hints.logisticsPlaceholder} tv={tv} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={p.fields.instagram} id="partner-instagram" value={form.instagram} onChange={(v) => patch({ instagram: v })} tv={tv} />
            <Field label={p.fields.whatsapp} id="partner-whatsapp" value={form.whatsapp} onChange={(v) => patch({ whatsapp: v })} tv={tv} />
            <Field label={p.fields.website} id="partner-website" value={form.website} onChange={(v) => patch({ website: v })} tv={tv} />
            <Field label={p.fields.linkedin} id="partner-linkedin" value={form.linkedin} onChange={(v) => patch({ linkedin: v })} tv={tv} />
          </div>
        </section>
      )}

      {step === "documentation" && form.partnerType && (
        <PartnerDocumentationStep
          partnerType={form.partnerType}
          documents={documents}
          onChange={setDocuments}
          error={docsError || fieldErrors.documentation}
        />
      )}

      {step === "financial" && (
        <section className="space-y-6" aria-labelledby="partner-financial-step">
          <h2 id="partner-financial-step" className="text-lg font-semibold">
            {p.sections.financial}
          </h2>
          <PartnerSelectableCards
            name="payment-methods"
            legend={p.legends.paymentMethods}
            options={PAYMENT_METHODS.map((pm) => ({ value: pm, label: p.paymentMethod(pm) }))}
            value={form.paymentMethods}
            onChange={(v) => patch({ paymentMethods: v as string[] })}
            multiple
            columns={3}
            error={fieldErrors.paymentMethods}
          />
          {form.paymentMethods.includes("Pix") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="partner-pix-type" className="text-sm font-medium">{p.fields.pixKeyType} *</label>
                <select id="partner-pix-type" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.pixKeyType} onChange={(e) => patch({ pixKeyType: e.target.value })}>
                  <option value="">{p.actions.select}</option>
                  {PIX_KEY_TYPES.map((pt) => <option key={pt} value={pt}>{p.pixKeyType(pt)}</option>)}
                </select>
              </div>
              <Field label={p.fields.pixKey} id="partner-pix-key" value={form.pixKey} onChange={(v) => patch({ pixKey: v })} error={fieldErrors.pixKey} required tv={tv} />
            </div>
          )}
          {form.paymentMethods.includes("Transferência bancária") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="partner-bank" className="text-sm font-medium">{p.fields.bank} *</label>
                <select id="partner-bank" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.bankName} onChange={(e) => patch({ bankName: e.target.value })}>
                  <option value="">{p.actions.select}</option>
                  {BANK_OPTIONS.map((b) => <option key={b} value={b}>{p.bank(b)}</option>)}
                </select>
                {fieldErrors.bankName && <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.bankName)}</p>}
              </div>
              {form.bankName === "Outros" && (
                <Field label={p.fields.bankOther} id="partner-bank-other" value={form.bankNameOther} onChange={(v) => patch({ bankNameOther: v })} error={fieldErrors.bankNameOther} required tv={tv} />
              )}
              <Field label={p.fields.agency} id="partner-agency" value={form.agency} onChange={(v) => patch({ agency: v })} required tv={tv} />
              <Field label={p.fields.account} id="partner-account" value={form.accountNumber} onChange={(v) => patch({ accountNumber: v })} required tv={tv} />
              <Field label={p.fields.accountDigit} id="partner-digit" value={form.accountDigit} onChange={(v) => patch({ accountDigit: v })} tv={tv} />
              <div>
                <label htmlFor="partner-account-type" className="text-sm font-medium">{p.fields.accountType}</label>
                <select id="partner-account-type" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.accountType} onChange={(e) => patch({ accountType: e.target.value })}>
                  {ACCOUNT_TYPES.map((at) => <option key={at} value={at}>{p.accountType(at)}</option>)}
                </select>
              </div>
              <Field label={p.fields.accountHolder} id="partner-holder" value={form.accountHolder} onChange={(v) => patch({ accountHolder: v })} required tv={tv} />
              <Field label={p.fields.accountHolderDoc} id="partner-holder-doc" value={form.accountHolderDocument} onChange={(v) => patch({ accountHolderDocument: v })} tv={tv} />
            </div>
          )}
        </section>
      )}

      {step === "security" && (
        <section className="space-y-6" aria-labelledby="partner-security-step">
          <h2 id="partner-security-step" className="text-lg font-semibold">
            {p.sections.security}
          </h2>
          <FoundationPasswordField id="partner-password" label={p.fields.password} value={form.password} onChange={(v) => patch({ password: v })} context={passwordContext} required showRecommendations />
          {fieldErrors.password && <p className="text-sm text-red-600" role="alert">{tv(fieldErrors.password)}</p>}
          <FoundationConfirmPasswordField id="partner-confirm-password" label={p.fields.confirmPassword} value={form.confirmPassword} password={form.password} onChange={(v) => patch({ confirmPassword: v })} required />
          {fieldErrors.confirmPassword && <p className="text-sm text-red-600" role="alert">{tv(fieldErrors.confirmPassword)}</p>}
          <PartnerLegalAcceptance
            acceptTerms={acceptTerms}
            acceptPrivacy={acceptPrivacy}
            onAcceptTermsChange={setAcceptTerms}
            onAcceptPrivacyChange={setAcceptPrivacy}
            error={termsError || fieldErrors.legal}
          />
          {turnstileEnabled ? (
            <TurnstileField
              action={TURNSTILE_ACTIONS.REGISTER_PARTNER}
              state={turnstile.state}
              resetKey={turnstile.resetKey}
              onVerify={turnstile.onVerify}
              onExpire={turnstile.onExpire}
              onError={turnstile.onError}
              onLoad={turnstile.onLoad}
            />
          ) : null}
        </section>
      )}

      {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{tv(error) || error}</p>}

      <div className="space-y-3">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step !== "type" ? (
            <Button type="button" variant="outline" onClick={goBack}>
              {p.actions.back}
            </Button>
          ) : (
            <div />
          )}
          {step === "security" ? (
            <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmitPartner}>
              {loading ? p.actions.finishing : p.actions.finish}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              {p.actions.continue}
            </Button>
          )}
        </div>
        <StepValidationFeedback messages={stepFeedback} />
      </div>

      {!embedded && (
        <p className="text-center text-sm text-gray-600">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            {t("auth.login.submitAccount")}
          </Link>
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  error,
  required,
  hint,
  min,
  max,
  autoComplete,
  placeholder,
  tv,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  min?: string;
  max?: string;
  autoComplete?: string;
  placeholder?: string;
  tv?: (message: string | undefined) => string;
}) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1"
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      />
      {hint && <p id={hintId} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{tv ? tv(error) : error}</p>}
    </div>
  );
}
