"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CountryCode } from "libphonenumber-js";
import { Check, ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegisterProgress } from "@/components/features/foundation/register-progress";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import { InternationalPhoneField } from "@/components/features/foundation/international-phone-field";
import { PartnerSelectableCards } from "@/components/features/foundation/partner/partner-selectable-cards";
import { PartnerLogoUpload, type PartnerLogoValue } from "@/components/features/foundation/partner/partner-logo-upload";
import { OngTypeSelector } from "@/components/features/foundation/ong/ong-type-selector";
import {
  OngDocumentationStep,
  type OngDocumentItem,
} from "@/components/features/foundation/ong/ong-documentation-step";
import {
  OngLegalAcceptance,
  ONG_LEGAL_ACCEPTANCE_MESSAGE,
} from "@/components/features/foundation/ong/ong-legal-acceptance";
import {
  INDIVIDUAL_ACTION_AREAS,
  INSTITUTION_ACTION_AREAS,
  ONG_FOCUS_AREAS,
  ONG_REPRESENTATIVE_ROLES,
  type OngType,
} from "@/lib/ong/constants";
import {
  INITIAL_ONG_FORM,
  ONG_DRAFT_KEY,
  formToOngRegisterPayload,
  type OngFormState,
} from "@/lib/ong/form-state";
import { validateRequiredOngDocuments } from "@/lib/ong/document-validation";
import { uploadOngRegistrationAssets } from "@/lib/ong/post-register-assets";
import {
  normalizeFullName,
  isValidFullName,
  FULL_NAME_INCOMPLETE_MESSAGE,
} from "@/lib/validation/full-name";
import { getEmailLiveFeedback, EMAIL_INVALID_MESSAGE } from "@/lib/validation/email";
import {
  getPhoneLiveFeedback,
  resolveRegistrationPhoneE164,
  BR_DDD_REQUIRED_MESSAGE,
  PHONE_INVALID_MESSAGE,
} from "@/lib/validation/international-phone";
import { validateActivityStartDate, getActivityStartDateBounds } from "@/lib/validation/activity-start-date";
import { validateStrongPassword, PASSWORD_MISMATCH_MESSAGE } from "@/lib/password/validate-strong-password";
import { maskCpf, maskCnpj, onlyDigits, validateCpfChecksum, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { confirmSessionCookie } from "@/lib/auth/confirm-session";
import { notifySessionChanged } from "@/lib/auth/session-events";
import { mapRegisterConflictMessage, parseApiFailureError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { StepValidationFeedback } from "@/components/features/foundation/step-validation-feedback";
import { collectUniqueErrorMessages, duplicateRegistrationError } from "@/lib/registration/collect-step-errors";
import { useDocumentAvailability } from "@/lib/registration/use-document-availability";
import { useOngRegisterCopy } from "@/lib/i18n/use-register-copy";
import { isValidUsername, normalizeUsername, sanitizeUsernameInput } from "@/lib/validation/username";

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

type StepId =
  | "type"
  | "responsible"
  | "institutional"
  | "activity"
  | "profile"
  | "documentation"
  | "security"
  | "success";

function stepLabels(
  ongType: OngType | null,
  steps: ReturnType<typeof useOngRegisterCopy>["o"]["steps"]
): { id: StepId; label: string }[] {
  if (ongType === "INSTITUTION") {
    return [
      { id: "type", label: steps.type },
      { id: "responsible", label: steps.responsibleInstitution },
      { id: "institutional", label: steps.institutional },
      { id: "activity", label: steps.activity },
      { id: "profile", label: steps.profile },
      { id: "documentation", label: steps.documentation },
      { id: "security", label: steps.security },
    ];
  }
  if (ongType === "INDIVIDUAL") {
    return [
      { id: "type", label: steps.type },
      { id: "responsible", label: steps.responsible },
      { id: "activity", label: steps.activity },
      { id: "profile", label: steps.profile },
      { id: "documentation", label: steps.documentation },
      { id: "security", label: steps.security },
    ];
  }
  return [{ id: "type", label: steps.type }];
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  error,
  tv,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
  tv?: (message: string | undefined) => string;
}) {
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
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {tv ? tv(error) : error}
        </p>
      )}
    </div>
  );
}

function CoverImageUpload({
  value,
  onChange,
  label,
  uploadLabel,
  replaceLabel,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  label: string;
  uploadLabel: string;
  replaceLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 dark:border-white/10">
      <p className="text-sm font-medium">{label}</p>
      {preview ? (
        <div className="relative mt-2 aspect-[3/1] overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mt-2 flex aspect-[3/1] items-center justify-center rounded-lg bg-gray-50 text-muted-foreground">
          <ImageIcon className="h-8 w-8" aria-hidden />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        {value ? replaceLabel : uploadLabel}
      </Button>
    </div>
  );
}

export function OngRegisterForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
  const { t, tv, tpwError, tApi, validation: v, o } = useOngRegisterCopy();
  const [step, setStep] = useState<StepId>("type");
  const [form, setForm] = useState<OngFormState>(INITIAL_ONG_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("BR");
  const [brazilDdd, setBrazilDdd] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [profileImage, setProfileImage] = useState<PartnerLogoValue>({ previewUrl: null, file: null, alt: "" });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<PartnerLogoValue>({ previewUrl: null, file: null, alt: "" });
  const [documents, setDocuments] = useState<OngDocumentItem[]>([]);
  const [docsError, setDocsError] = useState("");
  const [stepFeedback, setStepFeedback] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONG_DRAFT_KEY);
      if (raw) setForm({ ...INITIAL_ONG_FORM, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ONG_DRAFT_KEY, JSON.stringify({ ...form, password: "", confirmPassword: "" }));
    } catch {
      /* ignore */
    }
  }, [form]);

  const steps = stepLabels(form.ongType, o.steps);
  const currentIndex = steps.findIndex((s) => s.id === step);
  const progressSteps = steps.map((s) => s.label);
  const actionAreas = form.ongType === "INSTITUTION" ? INSTITUTION_ACTION_AREAS : INDIVIDUAL_ACTION_AREAS;

  const passwordContext = useMemo(
    () => ({
      email: form.email.trim().toLowerCase(),
      name: normalizeFullName(form.name),
      username: form.username.toLowerCase(),
      phone: form.phone,
    }),
    [form.email, form.name, form.username, form.phone]
  );

  const cpfAvailability = useDocumentAvailability("cpf", form.cpf);
  const cnpjAvailability = useDocumentAvailability("cnpj", form.ongType === "INSTITUTION" ? form.cnpj : "");

  function patch(partial: Partial<OngFormState>) {
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

  function validateStep(current: StepId): Record<string, string> {
    const errors: Record<string, string> = {};

    if (current === "type") {
      if (!form.ongType) errors.ongType = o.validation.ongTypeRequired;
    }

    if (current === "responsible") {
      if (!isValidFullName(form.name)) errors.name = v.fullNameIncomplete;
      const cpfDigits = onlyDigits(form.cpf);
      if (!validateCpfChecksum(cpfDigits)) errors.cpf = v.cpfInvalid;
      else if (cpfAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      if (!getEmailLiveFeedback(form.email).valid) errors.email = v.emailInvalid;
      const phoneFb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
      if (!phoneFb.valid) errors.phone = phoneFb.message ?? v.phoneInvalid;
      if (!isValidUsername(form.username)) errors.username = o.validation.usernameInvalid;
      if (usernameStatus === "taken") Object.assign(errors, duplicateRegistrationError());
      if (form.ongType === "INDIVIDUAL") {
        const dateErr = validateActivityStartDate(form.activityStartDate);
        if (dateErr) errors.activityStartDate = tv(dateErr) ?? dateErr;
      }
      if (form.ongType === "INSTITUTION") {
        if (!form.representativeRole) errors.representativeRole = o.validation.representativeRoleRequired;
        if (form.representativeRole === "Outro" && form.representativeRoleOther.trim().length < 2) {
          errors.representativeRoleOther = o.validation.representativeRoleOtherRequired;
        }
      }
    }

    if (current === "institutional" && form.ongType === "INSTITUTION") {
      if (!validateCnpjChecksum(onlyDigits(form.cnpj))) errors.cnpj = v.cnpjInvalid;
      else if (cnpjAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      if (form.ongName.trim().length < 2) errors.ongName = o.validation.ongNameRequired;
      if (form.legalName.trim().length < 2) errors.legalName = o.validation.legalNameRequired;
      if (!form.foundedDate) errors.foundedDate = o.validation.foundedDateRequired;
      if (!form.focusArea) errors.focusArea = o.validation.focusAreaRequired;
      if (form.focusArea === "Outro" && form.focusAreaOther.trim().length < 2) {
        errors.focusAreaOther = o.validation.focusAreaOtherRequired;
      }
      if (!form.city.trim()) errors.city = o.validation.cityRequired;
      if (form.state.length !== 2) errors.state = o.validation.stateRequired;
    }

    if (current === "activity") {
      if (!form.actionTypes.length) errors.actionTypes = o.validation.actionTypesRequired;
      if (form.actionTypes.includes("OUTROS") && form.actionTypesOther.trim().length < 3) {
        errors.actionTypesOther = o.validation.actionTypesOtherRequired;
      }
    }

    if (current === "profile") {
      if (form.description.trim().length < 40) {
        errors.description =
          form.ongType === "INSTITUTION"
            ? o.validation.descriptionInstitution
            : o.validation.descriptionIndividual;
      }
      if (form.ongType === "INDIVIDUAL") {
        if (!form.city.trim()) errors.city = o.validation.cityRequired;
        if (form.state.length !== 2) errors.state = o.validation.stateRequired;
      }
      if (form.ongType === "INSTITUTION") {
        if (form.mission.trim().length < 10) errors.mission = o.validation.missionRequired;
        if (form.vision.trim().length < 10) errors.vision = o.validation.visionRequired;
      }
    }

    if (current === "documentation" && form.ongType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredOngDocuments(form.ongType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        errors.documentation = docCheck.message ?? "";
      } else {
        setDocsError("");
      }
    }

    if (current === "security") {
      if (form.ongType) {
        const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
        const docCheck = validateRequiredOngDocuments(form.ongType, provided);
        if (!docCheck.valid) {
          setDocsError(docCheck.message ?? "");
          errors.documentation = docCheck.message ?? "";
        }
      }
      const pwd = validateStrongPassword(form.password, passwordContext);
      if (!pwd.valid) {
        errors.password = pwd.errorId ? tpwError(pwd.errorId) : o.validation.passwordInvalid;
      }
      if (form.password !== form.confirmPassword) errors.confirmPassword = v.passwordMismatch;
      if (!acceptTerms || !acceptPrivacy) {
        setTermsError(ONG_LEGAL_ACCEPTANCE_MESSAGE);
        errors.legal = t("auth.terms.acceptanceRequired");
      } else {
        setTermsError("");
      }
    }

    setFieldErrors(errors);
    return errors;
  }

  function goNext() {
    if (step === "responsible" && cpfAvailability === "checking") {
      setStepFeedback([o.validation.waitCpf]);
      return;
    }
    if (step === "institutional" && cnpjAvailability === "checking") {
      setStepFeedback([o.validation.waitCnpj]);
      return;
    }
    if (step === "responsible" && usernameStatus === "checking") {
      setStepFeedback([o.validation.waitUsername]);
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

    if (form.ongType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredOngDocuments(form.ongType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        setError(docCheck.message ?? o.validation.docsPending);
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
      const payload = formToOngRegisterPayload(form, phoneE164, {
        providedDocumentTypes: documents.filter((d) => d.status === "uploaded").map((d) => d.type),
      });
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        const { code, message } = parseApiFailureError(data);
        setError(res.status === 409 ? mapRegisterConflictMessage(code, message) : tApi(message, code) || o.validation.registerError);
        return;
      }
      localStorage.removeItem(ONG_DRAFT_KEY);
      setStep("success");
      await confirmSessionCookie();
      notifySessionChanged();
      await uploadOngRegistrationAssets({
        profileFile: form.ongType === "INDIVIDUAL" ? profileImage.file : logoImage.file ?? profileImage.file,
        coverFile: coverImage,
        logoFile: form.ongType === "INSTITUTION" ? logoImage.file : undefined,
        documents: documents.map((d) => ({
          id: d.id,
          type: d.type,
          typeLabel: d.typeLabel,
          file: d.file,
        })),
      });
    } catch {
      setError(t("auth.login.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  const activityBounds = getActivityStartDateBounds();

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold">{o.success.title}</h2>
        <p className="text-sm text-muted-foreground">{o.success.description}</p>
        <Button className="w-full" onClick={() => router.push(dashboardPathForRole("ONG"))}>
          {o.success.dashboard}
        </Button>
      </div>
    );
  }

  const patchSocial = (key: keyof OngFormState["socialLinks"], value: string) => {
    patch({ socialLinks: { ...form.socialLinks, [key]: value } });
  };

  return (
    <div className={cn("mx-auto w-full space-y-6", embedded ? "" : "max-w-3xl py-4")}>
      {form.ongType && step !== "type" && (
        <RegisterProgress steps={progressSteps} currentIndex={currentIndex} />
      )}

      {step === "type" && (
        <OngTypeSelector
          value={form.ongType}
          onChange={(v) => {
            patch({ ongType: v });
            setStep("responsible");
          }}
          error={fieldErrors.ongType}
        />
      )}

      {step === "responsible" && (
        <section className="space-y-4" aria-labelledby="ong-responsible-step">
          <h2 id="ong-responsible-step" className="text-lg font-semibold">
            {form.ongType === "INSTITUTION" ? o.sections.responsibleInstitution : o.sections.responsible}
          </h2>
          <Field id="ong-name" label={o.fields.fullName} value={form.name} onChange={(v) => patch({ name: v })} required error={fieldErrors.name} tv={tv} />
          <Field id="ong-cpf" label={o.fields.cpf} value={form.cpf} onChange={(v) => patch({ cpf: maskCpf(v) })} required error={fieldErrors.cpf} tv={tv} />
          <Field id="ong-email" label={o.fields.email} type="email" value={form.email} onChange={(v) => patch({ email: v })} required error={fieldErrors.email} tv={tv} />
          <InternationalPhoneField
            id="ong-phone"
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
            <Field
              id="ong-username"
              label={o.fields.username}
              value={form.username}
              onChange={(v) => patch({ username: sanitizeUsernameInput(v) })}
              required
              error={fieldErrors.username}
              tv={tv}
            />
            {usernameStatus === "checking" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> {o.hints.usernameChecking}
              </p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-xs text-emerald-700">{o.hints.usernameAvailable}</p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1 text-xs text-red-600">{o.hints.usernameTaken}</p>
            )}
          </div>
          {form.ongType === "INDIVIDUAL" && (
            <Field
              id="ong-activity-start"
              label={o.fields.activityStart}
              type="date"
              value={form.activityStartDate}
              onChange={(v) => patch({ activityStartDate: v })}
              required
              error={fieldErrors.activityStartDate}
              tv={tv}
            />
          )}
          {form.ongType === "INDIVIDUAL" && (
            <p className="text-xs text-muted-foreground">
              {o.hints.activityDateRange(activityBounds.min, activityBounds.max)}
            </p>
          )}
          {form.ongType === "INSTITUTION" && (
            <>
              <div>
                <label htmlFor="ong-role" className="text-sm font-medium">
                  {o.fields.representativeRole} *
                </label>
                <select
                  id="ong-role"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.representativeRole}
                  onChange={(e) => patch({ representativeRole: e.target.value })}
                >
                  <option value="">{o.actions.select}</option>
                  {ONG_REPRESENTATIVE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {o.representativeRole(r)}
                    </option>
                  ))}
                </select>
                {fieldErrors.representativeRole && (
                  <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.representativeRole)}</p>
                )}
              </div>
              {form.representativeRole === "Outro" && (
                <Field
                  id="ong-role-other"
                  label={o.fields.representativeRoleOther}
                  value={form.representativeRoleOther}
                  onChange={(v) => patch({ representativeRoleOther: v })}
                  required
                  error={fieldErrors.representativeRoleOther}
                  tv={tv}
                />
              )}
            </>
          )}
        </section>
      )}

      {step === "institutional" && form.ongType === "INSTITUTION" && (
        <section className="space-y-4" aria-labelledby="ong-institutional-step">
          <h2 id="ong-institutional-step" className="text-lg font-semibold">
            {o.sections.institutional}
          </h2>
          <Field id="ong-cnpj" label={t("auth.register.fields.cnpj")} value={form.cnpj} onChange={(v) => patch({ cnpj: maskCnpj(v) })} required error={fieldErrors.cnpj} tv={tv} />
          <Field id="ong-name-inst" label={o.fields.ongName} value={form.ongName} onChange={(v) => patch({ ongName: v })} required error={fieldErrors.ongName} tv={tv} />
          <Field id="ong-legal-name" label={o.fields.legalName} value={form.legalName} onChange={(v) => patch({ legalName: v })} required error={fieldErrors.legalName} tv={tv} />
          <Field id="ong-trade-name" label={t("auth.register.fields.tradeName")} value={form.tradeName} onChange={(v) => patch({ tradeName: v })} tv={tv} />
          <Field id="ong-founded" label={o.fields.foundedDate} type="date" value={form.foundedDate} onChange={(v) => patch({ foundedDate: v })} required error={fieldErrors.foundedDate} tv={tv} />
          <div>
            <label htmlFor="ong-focus" className="text-sm font-medium">
              {o.fields.focusArea} *
            </label>
            <select
              id="ong-focus"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.focusArea}
              onChange={(e) => patch({ focusArea: e.target.value })}
            >
              <option value="">{o.actions.select}</option>
              {ONG_FOCUS_AREAS.map((a) => (
                <option key={a} value={a}>
                  {o.focusArea(a)}
                </option>
              ))}
            </select>
            {fieldErrors.focusArea && <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.focusArea)}</p>}
          </div>
          {form.focusArea === "Outro" && (
            <Field id="ong-focus-other" label={o.fields.focusAreaOther} value={form.focusAreaOther} onChange={(v) => patch({ focusAreaOther: v })} required error={fieldErrors.focusAreaOther} tv={tv} />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ong-city-inst" label={o.fields.city} value={form.city} onChange={(v) => patch({ city: v })} required error={fieldErrors.city} tv={tv} />
            <div>
              <label htmlFor="ong-state-inst" className="text-sm font-medium">
                {o.fields.state} *
              </label>
              <select
                id="ong-state-inst"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.state}
                onChange={(e) => patch({ state: e.target.value })}
              >
                <option value="">{o.fields.statePlaceholder}</option>
                {BRAZIL_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {fieldErrors.state && <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.state)}</p>}
            </div>
          </div>
        </section>
      )}

      {step === "activity" && (
        <section className="space-y-4" aria-labelledby="ong-activity-step">
          <h2 id="ong-activity-step" className="text-lg font-semibold">
            {o.sections.activity}
          </h2>
          <PartnerSelectableCards
            name="ong-action-types"
            legend={o.legends.actionAreas}
            options={actionAreas.map((a) => ({ value: a.value, label: o.actionArea(a.value), icon: a.icon }))}
            value={form.actionTypes}
            onChange={(v) => patch({ actionTypes: v as string[] })}
            multiple
            columns={2}
            error={fieldErrors.actionTypes}
          />
          {form.actionTypes.includes("OUTROS") && (
            <Field
              id="ong-action-other"
              label={o.fields.actionAreaOther}
              value={form.actionTypesOther}
              onChange={(v) => patch({ actionTypesOther: v })}
              required
              error={fieldErrors.actionTypesOther}
              tv={tv}
            />
          )}
        </section>
      )}

      {step === "profile" && (
        <section className="space-y-6" aria-labelledby="ong-profile-step">
          <h2 id="ong-profile-step" className="text-lg font-semibold">
            {form.ongType === "INSTITUTION" ? o.sections.profileInstitution : o.sections.profileIndividual}
          </h2>

          {form.ongType === "INDIVIDUAL" ? (
            <PartnerLogoUpload
              value={profileImage}
              onChange={setProfileImage}
              businessName={form.name}
              fieldId="ong-profile-photo"
            />
          ) : (
            <PartnerLogoUpload
              value={logoImage}
              onChange={setLogoImage}
              businessName={form.ongName || form.legalName}
              fieldId="ong-logo"
            />
          )}

          <CoverImageUpload
            value={coverImage}
            onChange={setCoverImage}
            label={form.ongType === "INSTITUTION" ? o.fields.coverInstitution : o.fields.coverIndividual}
            uploadLabel={o.fields.uploadImage}
            replaceLabel={o.fields.replaceImage}
          />

          <div>
            <label htmlFor="ong-description" className="text-sm font-medium">
              {form.ongType === "INSTITUTION" ? o.fields.descriptionInstitution : o.fields.descriptionIndividual}
            </label>
            <textarea
              id="ong-description"
              className="mt-1 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              maxLength={1200}
            />
            {fieldErrors.description && <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.description)}</p>}
          </div>

          {form.ongType === "INSTITUTION" && (
            <>
              <Field id="ong-mission" label={o.fields.mission} value={form.mission} onChange={(v) => patch({ mission: v })} required error={fieldErrors.mission} tv={tv} />
              <Field id="ong-vision" label={o.fields.vision} value={form.vision} onChange={(v) => patch({ vision: v })} required error={fieldErrors.vision} tv={tv} />
            </>
          )}

          <Field
            id="ong-capacity"
            label={o.fields.animalCapacity}
            type="number"
            value={form.animalCapacity}
            onChange={(v) => patch({ animalCapacity: v.replace(/\D/g, "") })}
            tv={tv}
          />

          {form.ongType === "INDIVIDUAL" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ong-city" label={o.fields.city} value={form.city} onChange={(v) => patch({ city: v })} required error={fieldErrors.city} tv={tv} />
              <div>
                <label htmlFor="ong-state" className="text-sm font-medium">
                  {o.fields.state} *
                </label>
                <select
                  id="ong-state"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.state}
                  onChange={(e) => patch({ state: e.target.value })}
                >
                  <option value="">{o.fields.statePlaceholder}</option>
                  {BRAZIL_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {fieldErrors.state && <p className="mt-1 text-sm text-red-600">{tv(fieldErrors.state)}</p>}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ong-instagram" label={o.fields.instagram} value={form.socialLinks.instagram ?? ""} onChange={(v) => patchSocial("instagram", v)} tv={tv} />
            <Field id="ong-facebook" label={o.fields.facebook} value={form.socialLinks.facebook ?? ""} onChange={(v) => patchSocial("facebook", v)} tv={tv} />
            <Field id="ong-linkedin" label={o.fields.linkedin} value={form.socialLinks.linkedin ?? ""} onChange={(v) => patchSocial("linkedin", v)} tv={tv} />
            {form.ongType === "INSTITUTION" && (
              <Field id="ong-youtube" label={o.fields.youtube} value={form.socialLinks.youtube ?? ""} onChange={(v) => patchSocial("youtube", v)} tv={tv} />
            )}
            <Field id="ong-whatsapp" label={o.fields.whatsapp} value={form.socialLinks.whatsapp ?? ""} onChange={(v) => patchSocial("whatsapp", v)} tv={tv} />
            <Field id="ong-website" label={o.fields.website} value={form.socialLinks.website ?? ""} onChange={(v) => patchSocial("website", v)} tv={tv} />
          </div>

          <Field id="ong-pix" label={o.fields.pixDonations} value={form.pixKey} onChange={(v) => patch({ pixKey: v })} tv={tv} />
        </section>
      )}

      {step === "documentation" && form.ongType && (
        <OngDocumentationStep
          ongType={form.ongType}
          documents={documents}
          onChange={setDocuments}
          error={docsError || fieldErrors.documentation}
        />
      )}

      {step === "security" && (
        <section className="space-y-6" aria-labelledby="ong-security-step">
          <h2 id="ong-security-step" className="text-lg font-semibold">
            {o.sections.security}
          </h2>
          <FoundationPasswordField
            id="ong-password"
            label={o.fields.password}
            value={form.password}
            onChange={(v) => patch({ password: v })}
            context={passwordContext}
            required
            showRecommendations
          />
          {fieldErrors.password && <p className="text-sm text-red-600">{tv(fieldErrors.password)}</p>}
          <FoundationConfirmPasswordField
            id="ong-confirm-password"
            label={o.fields.confirmPassword}
            value={form.confirmPassword}
            password={form.password}
            onChange={(v) => patch({ confirmPassword: v })}
            required
          />
          {fieldErrors.confirmPassword && <p className="text-sm text-red-600">{tv(fieldErrors.confirmPassword)}</p>}
          <OngLegalAcceptance
            acceptTerms={acceptTerms}
            acceptPrivacy={acceptPrivacy}
            onAcceptTermsChange={setAcceptTerms}
            onAcceptPrivacyChange={setAcceptPrivacy}
            error={termsError || fieldErrors.legal}
          />
        </section>
      )}

      {step !== "type" && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={loading}>
            {o.actions.back}
          </Button>
          {step === "security" ? (
            <Button type="button" onClick={() => void handleSubmit()} disabled={loading || !acceptTerms || !acceptPrivacy}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {o.actions.finishing}
                </>
              ) : (
                o.actions.finish
              )}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              {o.actions.continue}
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {tv(error) || error}
        </p>
      )}
      <StepValidationFeedback messages={stepFeedback} />

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
