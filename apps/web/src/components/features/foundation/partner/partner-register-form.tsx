"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CountryCode } from "libphonenumber-js";
import { Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegisterProgress } from "@/components/features/foundation/register-progress";
import { FoundationPasswordField, FoundationConfirmPasswordField } from "@/components/features/foundation/password-field";
import { InternationalPhoneField } from "@/components/features/foundation/international-phone-field";
import { AddressByCepField } from "@/components/shared/address/address-by-cep-field";
import { PartnerTypeSelector, PARTNER_TYPE_REQUIRED_MESSAGE } from "@/components/features/foundation/partner/partner-type-selector";
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

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{4,30}$/;

function stepLabels(partnerType: PartnerType | null): { id: StepId; label: string }[] {
  if (partnerType === "CORPORATE") {
    return [
      { id: "type", label: "Tipo" },
      { id: "legal", label: "Representante" },
      { id: "corporate", label: "Corporativo" },
      { id: "professional", label: "Profissional" },
      { id: "operation", label: "Funcionamento" },
      { id: "documentation", label: "Documentação" },
      { id: "financial", label: "Financeiro" },
      { id: "security", label: "Segurança" },
    ];
  }
  return [
    { id: "type", label: "Tipo" },
    { id: "legal", label: "Representante" },
    { id: "professional", label: "Profissional" },
    { id: "operation", label: "Funcionamento" },
    { id: "documentation", label: "Documentação" },
    { id: "financial", label: "Financeiro" },
    { id: "security", label: "Segurança" },
  ];
}

export function PartnerRegisterForm({ embedded }: { embedded?: boolean }) {
  const router = useRouter();
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

  const steps = stepLabels(form.partnerType);
  const currentIndex = steps.findIndex((s) => s.id === step);
  const progressSteps = steps.map((s) => s.label);
  const canSubmitPartner = acceptTerms && acceptPrivacy && !loading;

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
    const trimmed = username.trim();
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameStatus(trimmed.length > 0 ? "invalid" : "idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
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
      if (!form.partnerType) errors.partnerType = PARTNER_TYPE_REQUIRED_MESSAGE;
    }

    if (current === "legal") {
      if (!isValidFullName(form.name)) errors.name = FULL_NAME_INCOMPLETE_MESSAGE;
      const cpfDigits = onlyDigits(form.cpf);
      if (form.partnerType === "AUTONOMOUS") {
        if (!validateCpfChecksum(cpfDigits)) errors.cpf = "Digite um CPF válido.";
        else if (cpfAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      }
      if (!getEmailLiveFeedback(form.email).valid) errors.email = EMAIL_INVALID_MESSAGE;
      const phoneFb = getPhoneLiveFeedback(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
      if (!phoneFb.valid) errors.phone = phoneFb.message ?? PHONE_INVALID_MESSAGE;
      if (!USERNAME_PATTERN.test(form.username)) errors.username = "Nome de usuário inválido (4–30 caracteres).";
      if (usernameStatus === "taken") Object.assign(errors, duplicateRegistrationError());
      const dateErr = validateActivityStartDate(form.activityStartDate);
      if (dateErr) errors.activityStartDate = dateErr;
    }

    if (current === "corporate" && form.partnerType === "CORPORATE") {
      if (!validateCnpjChecksum(onlyDigits(form.cnpj))) errors.cnpj = "Digite um CNPJ válido.";
      else if (cnpjAvailability === "taken") Object.assign(errors, duplicateRegistrationError());
      if (form.businessName.trim().length < 2) errors.businessName = "Nome comercial obrigatório.";
      if (form.legalName.trim().length < 2) errors.legalName = "Razão social obrigatória.";
      if (!form.corporateType) errors.corporateType = "Selecione o tipo corporativo.";
      if (form.corporateType === "Outro" && form.corporateTypeOther.trim().length < 2) {
        errors.corporateTypeOther = "Informe o tipo corporativo.";
      }
    }

    if (current === "professional") {
      if (form.partnerType === "AUTONOMOUS" && form.professionalName.trim().length < 2) {
        errors.professionalName = "Nome comercial obrigatório.";
      }
      if (!form.activityAreas.length) errors.activityAreas = "Selecione ao menos uma área de atuação.";
      if (form.activityAreas.includes("OUTROS") && form.activityAreasOther.trim().length < 3) {
        errors.activityAreasOther = "Descreva sua área de atuação.";
      }
      if (form.businessDescription.length < 80) errors.businessDescription = "Descreva melhor sua atuação profissional.";
      if (form.businessDescription.length > 800) errors.businessDescription = "A descrição deve ter no máximo 800 caracteres.";
      const a = form.addressDetails;
      if (!a.zipCode || a.zipCode.replace(/\D/g, "").length !== 8) errors["addressDetails.zipCode"] = "Digite um CEP válido.";
      if (!a.streetType) errors["addressDetails.streetType"] = "Selecione o tipo de logradouro.";
      if (a.streetType === "Outro" && !a.streetTypeOther.trim()) errors["addressDetails.streetTypeOther"] = "Informe o tipo de logradouro.";
      if (!a.street.trim()) errors["addressDetails.street"] = "Logradouro obrigatório.";
      if (!a.number.trim()) errors["addressDetails.number"] = "Número obrigatório.";
      if (!a.district.trim()) errors["addressDetails.district"] = "Bairro obrigatório.";
      if (!a.city.trim()) errors["addressDetails.city"] = "Cidade obrigatória.";
      if (a.state.length !== 2) errors["addressDetails.state"] = "UF obrigatória.";
    }

    if (current === "operation") {
      if (!form.operationModes.length) errors.operationModes = "Selecione ao menos uma forma de funcionamento.";
      const scheduleErr = validateOperationSchedule(
        form.operationModes,
        form.weekdays,
        form.openTime,
        form.closeTime
      );
      if (scheduleErr) {
        errors[scheduleErr.field ?? "openTime"] = scheduleErr.message;
      }
      if (!form.serviceRadius) errors.serviceRadius = "Selecione o raio de atendimento.";
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
      if (!form.paymentMethods.length) errors.paymentMethods = "Selecione ao menos uma forma de pagamento.";
      if (form.paymentMethods.includes("Pix") && (!form.pixKeyType || !form.pixKey.trim())) {
        errors.pixKey = "Informe a chave Pix.";
      }
      if (form.paymentMethods.includes("Transferência bancária")) {
        if (!form.bankName || !form.agency || !form.accountNumber || !form.accountHolder) {
          errors.bankName = "Preencha os dados bancários.";
        }
        if (form.bankName === "Outros" && !form.bankNameOther.trim()) errors.bankNameOther = "Informe o banco.";
      }
    }

    if (current === "security") {
      const pwd = validateStrongPassword(form.password, passwordContext);
      if (!pwd.valid) errors.password = pwd.error ?? "Senha inválida.";
      if (form.password !== form.confirmPassword) errors.confirmPassword = PASSWORD_MISMATCH_MESSAGE;
      if (!acceptTerms || !acceptPrivacy) setTermsError(PARTNER_LEGAL_ACCEPTANCE_MESSAGE);
      else setTermsError("");
      if (!acceptTerms || !acceptPrivacy) errors.legal = PARTNER_LEGAL_ACCEPTANCE_MESSAGE;
    }

    setFieldErrors(errors);
    return errors;
  }

  function goNext() {
    if (form.partnerType === "AUTONOMOUS" && step === "legal" && cpfAvailability === "checking") {
      setStepFeedback(["Aguarde a verificação do CPF."]);
      return;
    }
    if (form.partnerType === "CORPORATE" && step === "corporate" && cnpjAvailability === "checking") {
      setStepFeedback(["Aguarde a verificação do CNPJ."]);
      return;
    }
    if (step === "legal" && usernameStatus === "checking") {
      setStepFeedback(["Aguarde a verificação do nome de usuário."]);
      return;
    }

    const errors = validateStep(step);
    const messages = collectUniqueErrorMessages(errors);
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
    const messages = collectUniqueErrorMessages(errors);
    setStepFeedback(messages);
    if (messages.length > 0) return;
    if (form.partnerType) {
      const provided = documents.filter((d) => d.status === "uploaded").map((d) => d.type);
      const docCheck = validateRequiredDocuments(form.partnerType, provided);
      if (!docCheck.valid) {
        setDocsError(docCheck.message ?? "");
        setError(docCheck.message ?? "Documentos obrigatórios pendentes.");
        return;
      }
    }
    setLoading(true);
    setError("");
    const phoneE164 = resolveRegistrationPhoneE164(form.phone, phoneCountry, phoneCountry === "BR" ? brazilDdd : undefined);
    if (!phoneE164) {
      setError(phoneCountry === "BR" && !brazilDdd ? BR_DDD_REQUIRED_MESSAGE : PHONE_INVALID_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      const payload = formToRegisterPayload(form, phoneE164, {
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
        setError(res.status === 409 ? mapRegisterConflictMessage(code, message) : message || "Erro ao cadastrar");
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
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  const activityBounds = getActivityStartDateBounds();
  const filteredAreas = ACTIVITY_AREAS.filter((a) =>
    a.label.toLowerCase().includes(areaFilter.toLowerCase())
  );

  if (step === "success") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold">Cadastro de parceiro concluído com sucesso.</h2>
        <p className="text-sm text-muted-foreground">Sua conta está ativa. Acesse o painel para configurar produtos e serviços.</p>
        <Button className="w-full" onClick={() => router.push(dashboardPathForRole("PARTNER"))}>
          Acessar painel do parceiro
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
            Dados do representante legal
          </h2>
          <Field label="Nome completo do responsável" id="partner-name" value={form.name} onChange={(v) => patch({ name: v })} error={fieldErrors.name} required hint="Escreva o seu nome completo." />
          {form.partnerType === "AUTONOMOUS" && (
            <>
              <Field label="CPF" id="partner-cpf" value={form.cpf} onChange={(v) => patch({ cpf: maskCpf(v) })} error={fieldErrors.cpf} required />
              {cpfSyncMessage && !cpfNameMismatch && (
                <p className="text-xs text-muted-foreground" aria-live="polite">{cpfSyncMessage}</p>
              )}
              {cpfNameMismatch && (
                <p className="text-sm text-amber-700" role="status" aria-live="polite">{CPF_NAME_MISMATCH_MESSAGE}</p>
              )}
            </>
          )}
          <Field label="E-mail" id="partner-email" type="email" value={form.email} onChange={(v) => patch({ email: v })} error={fieldErrors.email} required autoComplete="email" />
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
            <Field label="Nome de usuário" id="partner-username" value={form.username} onChange={(v) => patch({ username: v })} error={fieldErrors.username} required autoComplete="username" />
            {usernameStatus === "available" && <p className="mt-1 text-xs text-green-700">Nome de usuário disponível</p>}
          </div>
          <Field label="Data de início das atividades" id="partner-activity-start" type="date" value={form.activityStartDate} onChange={(v) => patch({ activityStartDate: v })} error={fieldErrors.activityStartDate} required min={activityBounds.min} max={activityBounds.max} />
        </section>
      )}

      {step === "corporate" && form.partnerType === "CORPORATE" && (
        <section className="space-y-4" aria-labelledby="partner-corporate-step">
          <h2 id="partner-corporate-step" className="text-lg font-semibold">
            Dados corporativos
          </h2>
          <Field label="CNPJ" id="partner-cnpj" value={form.cnpj} onChange={(v) => patch({ cnpj: maskCnpj(v) })} error={fieldErrors.cnpj} required />
          {cnpjLookupLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Consultando CNPJ na Receita Federal via BrasilAPI...
            </p>
          )}
          {cnpjWarnings.map((w) => (
            <p key={w} className="text-sm text-amber-700" role="status" aria-live="polite">{w}</p>
          ))}
          {cnpjLookupInfo && !cnpjLookupLoading && (
            <p className="text-xs text-emerald-800" aria-live="polite">{cnpjLookupInfo}</p>
          )}
          <Field label="Nome comercial" id="partner-business-name" value={form.businessName} onChange={(v) => patch({ businessName: v })} error={fieldErrors.businessName} required />
          <Field label="Razão social" id="partner-legal-name" value={form.legalName} onChange={(v) => patch({ legalName: v })} error={fieldErrors.legalName} required />
          <div>
            <label htmlFor="partner-corporate-type" className="text-sm font-medium">Tipo corporativo *</label>
            <select
              id="partner-corporate-type"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={form.corporateType}
              onChange={(e) => patch({ corporateType: e.target.value })}
              aria-invalid={!!fieldErrors.corporateType}
            >
              <option value="">Selecione</option>
              {CORPORATE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {fieldErrors.corporateType && <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.corporateType}</p>}
          </div>
          {form.corporateType === "Outro" && (
            <Field label="Informe o tipo corporativo" id="partner-corporate-other" value={form.corporateTypeOther} onChange={(v) => patch({ corporateTypeOther: v })} error={fieldErrors.corporateTypeOther} required />
          )}
        </section>
      )}

      {step === "professional" && (
        <section className="space-y-6" aria-labelledby="partner-professional-step">
          <h2 id="partner-professional-step" className="text-lg font-semibold">
            Dados profissionais
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
            <Field label="Nome comercial / profissional" id="partner-prof-name" value={form.professionalName} onChange={(v) => patch({ professionalName: v })} error={fieldErrors.professionalName} required />
          )}
          <div>
            <label htmlFor="partner-area-search" className="text-sm font-medium">Área de atuação *</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input id="partner-area-search" placeholder="Buscar área..." value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="pl-9" />
            </div>
            <div className="mt-3">
              <PartnerSelectableCards
                name="activity-areas"
                legend="Selecione uma ou mais áreas"
                options={filteredAreas.map((a) => ({ value: a.value, label: a.label, icon: a.icon }))}
                value={form.activityAreas}
                onChange={(v) => patch({ activityAreas: v as string[] })}
                multiple
                columns={3}
                error={fieldErrors.activityAreas}
              />
            </div>
            {form.activityAreas.includes("OUTROS") && (
              <Field label="Descreva sua área de atuação" id="partner-area-other" value={form.activityAreasOther} onChange={(v) => patch({ activityAreasOther: v })} error={fieldErrors.activityAreasOther} required />
            )}
          </div>
          <div>
            <label htmlFor="partner-description" className="text-sm font-medium">Descrição do negócio *</label>
            <textarea
              id="partner-description"
              className="mt-1 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              value={form.businessDescription}
              onChange={(e) => patch({ businessDescription: e.target.value })}
              maxLength={800}
              aria-describedby="partner-description-count"
              aria-invalid={!!fieldErrors.businessDescription}
            />
            <p id="partner-description-count" className="mt-1 text-xs text-muted-foreground">{form.businessDescription.length} / 800</p>
            {fieldErrors.businessDescription && <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.businessDescription}</p>}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Endereço completo</h3>
            <div>
              <label htmlFor="partner-street-type" className="text-sm font-medium">Tipo de logradouro *</label>
              <select
                id="partner-street-type"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.addressDetails.streetType}
                onChange={(e) => patch({ addressDetails: { ...form.addressDetails, streetType: e.target.value } })}
              >
                {STREET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {form.addressDetails.streetType === "Outro" && (
              <Field label="Informe o tipo de logradouro" id="partner-street-type-other" value={form.addressDetails.streetTypeOther} onChange={(v) => patch({ addressDetails: { ...form.addressDetails, streetTypeOther: v } })} error={fieldErrors["addressDetails.streetTypeOther"]} required />
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
            Dados de funcionamento
          </h2>
          <PartnerSelectableCards
            name="operation-modes"
            legend="Funcionamento *"
            options={OPERATION_MODES.map((m) => ({ value: m.value, label: m.label }))}
            value={form.operationModes}
            onChange={(v) => patch({ operationModes: v as string[] })}
            multiple
            error={fieldErrors.operationModes}
          />
          {form.operationModes.includes("BY_APPOINTMENT") && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              O cliente poderá solicitar horários conforme sua disponibilidade.
            </p>
          )}
          {form.operationModes.includes("EMERGENCY") && (
            <p className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">
              Atendimento emergencial — dias e horários fixos não são obrigatórios.
            </p>
          )}
          {form.operationModes.includes("HOURS_24") && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
              Atendimento 24 horas — dias e horários fixos não são obrigatórios.
            </p>
          )}
          {requiresOperationSchedule(form.operationModes) && (
            <>
              <PartnerSelectableCards
                name="weekdays"
                legend="Dias de atendimento *"
                options={WEEKDAYS.map((d) => ({ value: d.value, label: d.label }))}
                value={form.weekdays}
                onChange={(v) => patch({ weekdays: v as string[] })}
                multiple
                columns={3}
                error={fieldErrors.weekdays}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Horário de abertura" id="partner-open" type="time" value={form.openTime} onChange={(v) => patch({ openTime: v })} error={fieldErrors.openTime} required />
                <Field label="Horário de fechamento" id="partner-close" type="time" value={form.closeTime} onChange={(v) => patch({ closeTime: v })} error={fieldErrors.closeTime} required />
              </div>
            </>
          )}
          <PartnerSelectableCards
            name="service-radius"
            legend="Raio de atendimento *"
            options={SERVICE_RADIUS_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            value={form.serviceRadius}
            onChange={(v) => patch({ serviceRadius: v as string })}
            error={fieldErrors.serviceRadius}
            columns={1}
          />
          <PartnerSelectableCards
            name="delivery-options"
            legend="Entrega e tele-busca"
            options={DELIVERY_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
            value={form.deliveryOptions}
            onChange={(v) => patch({ deliveryOptions: v as string[] })}
            multiple
          />
          {(form.deliveryOptions.includes("DELIVERY") || form.deliveryOptions.includes("TELEBUS")) && (
            <Field label="Observações logísticas" id="partner-logistics" value={form.logisticsNotes} onChange={(v) => patch({ logisticsNotes: v })} placeholder="Taxa, raio ou sob consulta" />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Instagram" id="partner-instagram" value={form.instagram} onChange={(v) => patch({ instagram: v })} />
            <Field label="WhatsApp" id="partner-whatsapp" value={form.whatsapp} onChange={(v) => patch({ whatsapp: v })} />
            <Field label="Site" id="partner-website" value={form.website} onChange={(v) => patch({ website: v })} />
            <Field label="LinkedIn" id="partner-linkedin" value={form.linkedin} onChange={(v) => patch({ linkedin: v })} />
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
            Dados financeiros
          </h2>
          <PartnerSelectableCards
            name="payment-methods"
            legend="Formas de pagamento aceitas *"
            options={PAYMENT_METHODS.map((p) => ({ value: p, label: p }))}
            value={form.paymentMethods}
            onChange={(v) => patch({ paymentMethods: v as string[] })}
            multiple
            columns={3}
            error={fieldErrors.paymentMethods}
          />
          {form.paymentMethods.includes("Pix") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="partner-pix-type" className="text-sm font-medium">Tipo de chave Pix *</label>
                <select id="partner-pix-type" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.pixKeyType} onChange={(e) => patch({ pixKeyType: e.target.value })}>
                  <option value="">Selecione</option>
                  {PIX_KEY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Field label="Chave Pix" id="partner-pix-key" value={form.pixKey} onChange={(v) => patch({ pixKey: v })} error={fieldErrors.pixKey} required />
            </div>
          )}
          {form.paymentMethods.includes("Transferência bancária") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="partner-bank" className="text-sm font-medium">Banco *</label>
                <select id="partner-bank" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.bankName} onChange={(e) => patch({ bankName: e.target.value })}>
                  <option value="">Selecione</option>
                  {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {fieldErrors.bankName && <p className="mt-1 text-sm text-red-600">{fieldErrors.bankName}</p>}
              </div>
              {form.bankName === "Outros" && (
                <Field label="Informe o banco" id="partner-bank-other" value={form.bankNameOther} onChange={(v) => patch({ bankNameOther: v })} error={fieldErrors.bankNameOther} required />
              )}
              <Field label="Agência" id="partner-agency" value={form.agency} onChange={(v) => patch({ agency: v })} required />
              <Field label="Conta corrente" id="partner-account" value={form.accountNumber} onChange={(v) => patch({ accountNumber: v })} required />
              <Field label="Dígito" id="partner-digit" value={form.accountDigit} onChange={(v) => patch({ accountDigit: v })} />
              <div>
                <label htmlFor="partner-account-type" className="text-sm font-medium">Tipo de conta</label>
                <select id="partner-account-type" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={form.accountType} onChange={(e) => patch({ accountType: e.target.value })}>
                  {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Field label="Titular da conta" id="partner-holder" value={form.accountHolder} onChange={(v) => patch({ accountHolder: v })} required />
              <Field label="CPF/CNPJ do titular" id="partner-holder-doc" value={form.accountHolderDocument} onChange={(v) => patch({ accountHolderDocument: v })} />
            </div>
          )}
        </section>
      )}

      {step === "security" && (
        <section className="space-y-6" aria-labelledby="partner-security-step">
          <h2 id="partner-security-step" className="text-lg font-semibold">
            Segurança
          </h2>
          <FoundationPasswordField id="partner-password" label="Senha" value={form.password} onChange={(v) => patch({ password: v })} context={passwordContext} required showRecommendations />
          {fieldErrors.password && <p className="text-sm text-red-600" role="alert">{fieldErrors.password}</p>}
          <FoundationConfirmPasswordField id="partner-confirm-password" label="Confirmar senha" value={form.confirmPassword} password={form.password} onChange={(v) => patch({ confirmPassword: v })} required />
          {fieldErrors.confirmPassword && <p className="text-sm text-red-600" role="alert">{fieldErrors.confirmPassword}</p>}
          <PartnerLegalAcceptance
            acceptTerms={acceptTerms}
            acceptPrivacy={acceptPrivacy}
            onAcceptTermsChange={setAcceptTerms}
            onAcceptPrivacyChange={setAcceptPrivacy}
            error={termsError || fieldErrors.legal}
          />
        </section>
      )}

      {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

      <div className="space-y-3">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step !== "type" ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Voltar
            </Button>
          ) : (
            <div />
          )}
          {step === "security" ? (
            <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmitPartner}>
              {loading ? "Concluindo..." : "Concluir cadastro"}
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Continuar
            </Button>
          )}
        </div>
        <StepValidationFeedback messages={stepFeedback} />
      </div>

      {!embedded && (
        <p className="text-center text-sm text-gray-600">
          Já tem conta? <Link href="/login" className="font-semibold text-green-700 hover:underline">Entrar</Link>
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
      {error && <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
    </div>
  );
}
