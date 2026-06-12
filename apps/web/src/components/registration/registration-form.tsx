"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import {
  BRAZILIAN_STATES,
  getDefaultFormValues,
  ONG_ACTION_TYPES,
  PENDING_APPROVAL_ROLES,
  PETSHOP_CATEGORIES,
  REGISTRATION_ROLES,
  SERVICE_TYPES,
  TUTOR_INTERESTS,
  type FormValues,
  type RegistrationRole,
} from "@/lib/registration/personas";
import { buildRegisterPayload, validateRegistration, USER_MESSAGES } from "@/lib/registration/validation";
import { maskCpf, maskCnpj, maskPhone, maskDocument } from "@/lib/validation/documents-shared";
import { todayIsoDate } from "@/lib/validation/documents";
import { AddressByCepField, toAddressValue } from "@/components/address/address-by-cep-field";
import { EcoPetLogo } from "@/components/brand/ecopet-logo";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "@/providers/i18n-provider";

const CLINIC_SERVICES = [
  "Consultas", "Cirurgias", "Exames", "Internação", "Vacinas", "Emergência 24h", "Odontologia", "Dermatologia",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ecopet-dark">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <select
        id={id}
        className="mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-4 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

function MultiCheckbox({
  options,
  selected,
  onChange,
  error,
}: {
  options: { value: string; label: string }[] | string[];
  selected: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {normalized.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-ecopet-gray/15 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, o.value]);
                else onChange(selected.filter((x) => x !== o.value));
              }}
              className="h-4 w-4 rounded border-ecopet-gray/30"
            />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-xl border border-ecopet-gray/15 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        {[
          { v: true, l: t("auth.register.fields.yes") },
          { v: false, l: t("auth.register.fields.no") },
        ].map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
              value === v ? "bg-ecopet-green text-white" : "bg-ecopet-gray/10 text-ecopet-gray"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function RegistrationAddressField({
  address,
  onChange,
  errors,
  title = "Endereço",
  idPrefix,
}: {
  address: FormValues;
  onChange: (a: FormValues) => void;
  errors: Record<string, string>;
  title?: string;
  idPrefix?: string;
}) {
  return (
    <AddressByCepField
      value={toAddressValue(address as Record<string, unknown>)}
      onChange={(v) => onChange(v as unknown as FormValues)}
      errors={errors}
      title={title}
      idPrefix={idPrefix}
    />
  );
}

function DocumentUpload({
  documents,
  onChange,
}: {
  documents: { name: string; size?: number; type?: string }[];
  onChange: (docs: { name: string; size?: number; type?: string }[]) => void;
}) {
  return (
    <div>
      <Label>Documentos (opcional)</Label>
      <input
        type="file"
        multiple
        className="mt-1 block w-full text-sm text-ecopet-gray file:mr-3 file:rounded-lg file:border-0 file:bg-ecopet-green/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-ecopet-green"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          onChange(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
        }}
      />
      {documents.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-ecopet-gray">
          {documents.map((d) => (
            <li key={d.name}>{d.name}</li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-ecopet-gray/70">Metadados salvos agora; upload completo na aprovação da conta.</p>
    </div>
  );
}

export function RegistrationForm() {
  const router = useRouter();
  const setApiToken = useAppStore((s) => s.setApiToken);
  const { t } = useTranslation();
  const [role, setRole] = useState<RegistrationRole>("TUTOR");
  const [values, setValues] = useState<FormValues>(() => getDefaultFormValues("TUTOR"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<{ message: string; redirectTo: string } | null>(null);

  const set = useCallback((key: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setAddress = useCallback((addr: FormValues) => {
    setValues((prev) => ({ ...prev, address: addr }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k === "address" || k.startsWith("address.")) delete next[k];
      }
      return next;
    });
  }, []);

  const validateField = useCallback(
    (key: string) => {
      const fieldErrors = validateRegistration(role, values);
      if (fieldErrors[key]) {
        setErrors((prev) => ({ ...prev, [key]: fieldErrors[key] }));
      }
    },
    [role, values]
  );

  const handleRoleChange = (newRole: RegistrationRole) => {
    setRole(newRole);
    setValues(getDefaultFormValues(newRole));
    setErrors({});
    setFormError("");
  };

  const isBusiness = ["CLINIC", "PETSHOP", "SELLER"].includes(role);
  const ongIsCnpj = role === "ONG" && values.documentType === "CNPJ";
  const nameLabel =
    isBusiness || ongIsCnpj
      ? t("auth.register.nameLabels.legalName")
      : role === "ONG"
        ? t("auth.register.nameLabels.protectorName")
        : t("auth.register.nameLabels.fullName");

  const roleLabel = (r: RegistrationRole) =>
    t(`auth.register.roles.${r}.label` as Parameters<typeof t>[0]);
  const roleDescription = (r: RegistrationRole) =>
    t(`auth.register.roles.${r}.description` as Parameters<typeof t>[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateRegistration(role, values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError(t("auth.register.validationSummary"));
      return;
    }

    setLoading(true);
    setFormError("");
    setErrors({});
    try {
      const payload = buildRegisterPayload(role, values);
      const res = await api<{
        token: string;
        redirectTo: string;
        pendingApproval?: boolean;
        message?: string;
        user: { accountStatus?: string };
      }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
      setApiToken(res.token);
      const signInResult = await signIn("credentials", {
        email: String(values.email),
        password: String(values.password),
        redirect: false,
      });
      if (signInResult?.error) {
        setFormError(t("auth.register.loginAfterRegisterError"));
        return;
      }
      const message =
        res.message ??
        (res.pendingApproval ? t("auth.register.successPending") : t("auth.register.successActive"));
      setSuccess({ message, redirectTo: res.redirectTo });
      setTimeout(() => router.push(res.redirectTo), 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("auth.register.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const address = (values.address ?? {}) as FormValues;
  const bankData = (values.bankData ?? {}) as FormValues;
  const showPendingNote = PENDING_APPROVAL_ROLES.includes(role);

  if (success) {
    return (
      <Card className="w-full max-w-2xl border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ecopet-green/10">
            <span className="text-2xl text-ecopet-green" aria-hidden>✓</span>
          </div>
          <p className="text-lg font-semibold text-ecopet-green">{success.message}</p>
          <p className="mt-2 text-sm text-ecopet-gray">{t("auth.register.successRedirecting")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl border-0 shadow-xl">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <EcoPetLogo variant="light" size="md" showText />
        </div>
        <CardTitle>{t("auth.register.title")}</CardTitle>
        <CardDescription>{t("auth.register.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Tipo de conta */}
          <div>
            <Label htmlFor="role" required>
              {t("auth.register.accountType")}
            </Label>
            <div className="relative mt-1">
              <select
                id="role"
                className="flex h-11 w-full appearance-none rounded-xl border border-ecopet-gray/20 px-4 pr-10 text-sm"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as RegistrationRole)}
              >
                {REGISTRATION_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {roleLabel(r.value)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecopet-gray" />
            </div>
            <p className="mt-1 text-xs text-ecopet-gray">
              {roleDescription(role)}
            </p>
            {showPendingNote && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t("auth.register.pendingApprovalNote")}
              </p>
            )}
          </div>

          {/* Campos comuns */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={isBusiness || role === "SERVICE_PROVIDER" ? "sm:col-span-2" : ""}>
              <Label htmlFor="name" required>
                {nameLabel}
              </Label>
              <Input id="name" className="mt-1" value={String(values.name ?? "")} onChange={(e) => set("name", e.target.value)} />
              <FieldError message={errors.name} />
            </div>

            {(isBusiness || role === "SELLER") && (
              <div className="sm:col-span-2">
                <Label htmlFor="tradeName" required>
                  {t("auth.register.fields.tradeName")}
                </Label>
                <Input id="tradeName" className="mt-1" value={String(values.tradeName ?? "")} onChange={(e) => set("tradeName", e.target.value)} />
              </div>
            )}

            <div>
              <Label htmlFor="email" required>
                {t("auth.register.fields.email")}
              </Label>
              <Input id="email" type="email" className="mt-1" value={String(values.email ?? "")} onChange={(e) => set("email", e.target.value)} />
              <FieldError message={errors.email} />
            </div>

            <div>
              <Label htmlFor="phone" required>
                {t("auth.register.fields.phone")}
              </Label>
              <Input id="phone" type="tel" className="mt-1" value={String(values.phone ?? "")} onChange={(e) => set("phone", maskPhone(e.target.value))} onBlur={() => validateField("phone")} placeholder={t("auth.register.fields.phonePlaceholder")} />
              <FieldError message={errors.phone} />
            </div>

            <PasswordInput
              id="password"
              value={String(values.password ?? "")}
              onChange={(v) => set("password", v)}
              confirmValue={String(values.confirmPassword ?? "")}
              onConfirmChange={(v) => set("confirmPassword", v)}
              error={errors.password}
              confirmError={errors.confirmPassword}
            />
          </div>

          {/* Campos por persona */}
          <div className="space-y-4 border-t border-ecopet-gray/10 pt-4">
            <p className="text-sm font-semibold text-ecopet-green">
              {t("auth.register.personaSection", { role: roleLabel(role) })}
            </p>

            {role === "TUTOR" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cpf" required>
                      CPF
                    </Label>
                    <Input id="cpf" className="mt-1" value={String(values.cpf ?? "")} onChange={(e) => set("cpf", maskCpf(e.target.value))} onBlur={() => validateField("cpf")} placeholder="000.000.000-00" />
                    <FieldError message={errors.cpf} />
                  </div>
                  <div>
                    <Label htmlFor="birthDate" required>
                      Data de nascimento
                    </Label>
                    <Input id="birthDate" type="date" max={todayIsoDate()} className="mt-1" value={String(values.birthDate ?? "")} onChange={(e) => set("birthDate", e.target.value)} onBlur={() => validateField("birthDate")} />
                    <FieldError message={errors.birthDate} />
                  </div>
                  <div>
                    <Label htmlFor="petCount">Quantidade de pets</Label>
                    <Input id="petCount" type="number" min={0} className="mt-1" value={String(values.petCount ?? 0)} onChange={(e) => set("petCount", e.target.value)} />
                  </div>
                </div>
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} />
                <div>
                  <Label required>Interesse principal</Label>
                  <MultiCheckbox
                    options={TUTOR_INTERESTS}
                    selected={(values.primaryInterests as string[]) ?? []}
                    onChange={(v) => set("primaryInterests", v)}
                    error={errors.primaryInterests}
                  />
                </div>
              </>
            )}

            {role === "VETERINARIAN" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cpf" required>
                      CPF
                    </Label>
                    <Input id="cpf" className="mt-1" value={String(values.cpf ?? "")} onChange={(e) => set("cpf", maskCpf(e.target.value))} onBlur={() => validateField("cpf")} />
                    <FieldError message={errors.cpf} />
                  </div>
                  <div>
                    <Label htmlFor="crmv" required>
                      CRMV
                    </Label>
                    <Input id="crmv" className="mt-1" value={String(values.crmv ?? "")} onChange={(e) => set("crmv", e.target.value)} placeholder="SP-12345" />
                    <FieldError message={errors.crmv} />
                  </div>
                  <div>
                    <Label htmlFor="crmvState" required>
                      UF do CRMV
                    </Label>
                    <SelectField
                      id="crmvState"
                      value={String(values.crmvState ?? "SP")}
                      onChange={(v) => set("crmvState", v)}
                      options={BRAZILIAN_STATES.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty" required>
                      Especialidade
                    </Label>
                    <Input id="specialty" className="mt-1" value={String(values.specialty ?? "")} onChange={(e) => set("specialty", e.target.value)} />
                    <FieldError message={errors.specialty} />
                  </div>
                  <div>
                    <Label htmlFor="averageConsultationPrice">Valor médio da consulta (R$)</Label>
                    <Input id="averageConsultationPrice" type="number" min={0} step="0.01" className="mt-1" value={String(values.averageConsultationPrice ?? "")} onChange={(e) => set("averageConsultationPrice", e.target.value)} />
                  </div>
                </div>
                <RegistrationAddressField
                  address={address}
                  onChange={setAddress}
                  errors={errors}
                  title="Endereço profissional"
                  idPrefix="vet-addr"
                />
                <YesNoToggle label="Atendimento presencial" value={Boolean(values.inPersonAvailable)} onChange={(v) => set("inPersonAvailable", v)} />
                <YesNoToggle label="Teleatendimento" value={Boolean(values.onlineAvailable)} onChange={(v) => set("onlineAvailable", v)} />
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}

            {role === "CLINIC" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cnpj" required>
                      CNPJ
                    </Label>
                    <Input id="cnpj" className="mt-1" value={String(values.cnpj ?? "")} onChange={(e) => set("cnpj", maskCnpj(e.target.value))} onBlur={() => validateField("cnpj")} />
                    <FieldError message={errors.cnpj} />
                  </div>
                  <div>
                    <Label htmlFor="technicalResponsible" required>
                      Responsável técnico
                    </Label>
                    <Input id="technicalResponsible" className="mt-1" value={String(values.technicalResponsible ?? "")} onChange={(e) => set("technicalResponsible", e.target.value)} />
                    <FieldError message={errors.technicalResponsible} />
                  </div>
                  <div>
                    <Label htmlFor="responsibleCrmv" required>
                      CRMV do responsável
                    </Label>
                    <Input id="responsibleCrmv" className="mt-1" value={String(values.responsibleCrmv ?? "")} onChange={(e) => set("responsibleCrmv", e.target.value)} />
                    <FieldError message={errors.responsibleCrmv} />
                  </div>
                  <div>
                    <Label htmlFor="hours" required>
                      Horário de funcionamento
                    </Label>
                    <Input id="hours" className="mt-1" value={String(values.hours ?? "")} onChange={(e) => set("hours", e.target.value)} placeholder="Seg-Sex 8h-18h" />
                    <FieldError message={errors.hours} />
                  </div>
                </div>
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} />
                <div>
                  <Label required>Serviços oferecidos</Label>
                  <MultiCheckbox
                    options={CLINIC_SERVICES}
                    selected={(values.services as string[]) ?? []}
                    onChange={(v) => set("services", v)}
                    error={errors.services}
                  />
                </div>
                <YesNoToggle label="Atendimento emergencial" value={Boolean(values.emergency)} onChange={(v) => set("emergency", v)} />
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}

            {role === "PETSHOP" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cnpj" required>
                      CNPJ
                    </Label>
                    <Input id="cnpj" className="mt-1" value={String(values.cnpj ?? "")} onChange={(e) => set("cnpj", maskCnpj(e.target.value))} onBlur={() => validateField("cnpj")} />
                    <FieldError message={errors.cnpj} />
                  </div>
                  <div>
                    <Label htmlFor="responsible" required>
                      Responsável
                    </Label>
                    <Input id="responsible" className="mt-1" value={String(values.responsible ?? "")} onChange={(e) => set("responsible", e.target.value)} />
                    <FieldError message={errors.responsible} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="hours" required>
                      Horário de funcionamento
                    </Label>
                    <Input id="hours" className="mt-1" value={String(values.hours ?? "")} onChange={(e) => set("hours", e.target.value)} />
                    <FieldError message={errors.hours} />
                  </div>
                </div>
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} />
                <YesNoToggle label="Vende produtos" value={Boolean(values.sellsProducts)} onChange={(v) => set("sellsProducts", v)} />
                <YesNoToggle label="Oferece serviços" value={Boolean(values.offersServices)} onChange={(v) => set("offersServices", v)} />
                <div>
                  <Label required>Categorias atendidas</Label>
                  <MultiCheckbox
                    options={PETSHOP_CATEGORIES}
                    selected={(values.categories as string[]) ?? []}
                    onChange={(v) => set("categories", v)}
                    error={errors.categories}
                  />
                </div>
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}

            {role === "SELLER" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cnpj" required>
                      CNPJ
                    </Label>
                    <Input id="cnpj" className="mt-1" value={String(values.cnpj ?? "")} onChange={(e) => set("cnpj", maskCnpj(e.target.value))} onBlur={() => validateField("cnpj")} />
                    <FieldError message={errors.cnpj} />
                  </div>
                  <div>
                    <Label htmlFor="responsible" required>
                      Responsável
                    </Label>
                    <Input id="responsible" className="mt-1" value={String(values.responsible ?? "")} onChange={(e) => set("responsible", e.target.value)} />
                    <FieldError message={errors.responsible} />
                  </div>
                </div>
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} />
                <div>
                  <Label required>Categorias de produtos</Label>
                  <MultiCheckbox
                    options={PETSHOP_CATEGORIES}
                    selected={(values.productCategories as string[]) ?? []}
                    onChange={(v) => set("productCategories", v)}
                    error={errors.productCategories}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryPolicy" required>
                    Política de entrega
                  </Label>
                  <textarea
                    id="deliveryPolicy"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-ecopet-gray/20 px-4 py-2 text-sm"
                    value={String(values.deliveryPolicy ?? "")}
                    onChange={(e) => set("deliveryPolicy", e.target.value)}
                  />
                  <FieldError message={errors.deliveryPolicy} />
                </div>
                <div>
                  <Label htmlFor="exchangePolicy" required>
                    Política de troca
                  </Label>
                  <textarea
                    id="exchangePolicy"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-ecopet-gray/20 px-4 py-2 text-sm"
                    value={String(values.exchangePolicy ?? "")}
                    onChange={(e) => set("exchangePolicy", e.target.value)}
                  />
                  <FieldError message={errors.exchangePolicy} />
                </div>
                <div className="rounded-xl border border-ecopet-gray/10 bg-ecopet-gray/5 p-4 space-y-3">
                  <p className="text-sm font-semibold">Dados bancários / Pix</p>
                  <div>
                    <Label htmlFor="pixKey" required>
                      Chave Pix
                    </Label>
                    <Input id="pixKey" className="mt-1" value={String(bankData.pixKey ?? "")} onChange={(e) => set("bankData", { ...bankData, pixKey: e.target.value })} />
                    <FieldError message={errors["bankData.pixKey"]} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="bankName">Banco</Label>
                      <Input id="bankName" className="mt-1" value={String(bankData.bankName ?? "")} onChange={(e) => set("bankData", { ...bankData, bankName: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="accountHolder">Titular</Label>
                      <Input id="accountHolder" className="mt-1" value={String(bankData.accountHolder ?? "")} onChange={(e) => set("bankData", { ...bankData, accountHolder: e.target.value })} />
                    </div>
                  </div>
                </div>
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}

            {role === "SERVICE_PROVIDER" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="documentType" required>
                      Tipo de documento
                    </Label>
                    <SelectField
                      id="documentType"
                      value={String(values.documentType ?? "CPF")}
                      onChange={(v) => set("documentType", v)}
                      options={[
                        { value: "CPF", label: "CPF" },
                        { value: "CNPJ", label: "CNPJ" },
                      ]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="documentNumber" required>
                      {values.documentType === "CNPJ" ? "CNPJ" : "CPF"}
                    </Label>
                    <Input
                      id="documentNumber"
                      className="mt-1"
                      value={String(values.documentNumber ?? "")}
                      onChange={(e) =>
                        set(
                          "documentNumber",
                          maskDocument(e.target.value, (values.documentType as "CPF" | "CNPJ") ?? "CPF")
                        )
                      }
                      onBlur={() => validateField("documentNumber")}
                    />
                    <FieldError message={errors.documentNumber} />
                  </div>
                  <div>
                    <Label htmlFor="startingPrice">Preço inicial (R$)</Label>
                    <Input id="startingPrice" type="number" min={0} step="0.01" className="mt-1" value={String(values.startingPrice ?? "")} onChange={(e) => set("startingPrice", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="availability" required>
                      Disponibilidade
                    </Label>
                    <Input id="availability" className="mt-1" value={String(values.availability ?? "")} onChange={(e) => set("availability", e.target.value)} placeholder="Seg-Sáb, manhã e tarde" />
                    <FieldError message={errors.availability} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serviceArea" required>
                    Área de atendimento
                  </Label>
                  <Input id="serviceArea" className="mt-1" value={String(values.serviceArea ?? "")} onChange={(e) => set("serviceArea", e.target.value)} placeholder="Zona Sul — São Paulo/SP" />
                  <FieldError message={errors.serviceArea} />
                </div>
                <div>
                  <Label required>Tipo de serviço</Label>
                  <MultiCheckbox
                    options={SERVICE_TYPES}
                    selected={(values.serviceTypes as string[]) ?? []}
                    onChange={(v) => set("serviceTypes", v)}
                    error={errors.serviceTypes}
                  />
                </div>
                <YesNoToggle label="Atendimento em domicílio" value={Boolean(values.homeService)} onChange={(v) => set("homeService", v)} />
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} title="Endereço base" idPrefix="sp-addr" />
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}

            {role === "ONG" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="documentType" required>
                      Tipo de documento
                    </Label>
                    <SelectField
                      id="documentType"
                      value={String(values.documentType ?? "CNPJ")}
                      onChange={(v) => set("documentType", v)}
                      options={[
                        { value: "CPF", label: "CPF (protetor individual)" },
                        { value: "CNPJ", label: "CNPJ (ONG)" },
                      ]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="documentNumber" required>
                      {values.documentType === "CNPJ" ? "CNPJ" : "CPF"}
                    </Label>
                    <Input
                      id="documentNumber"
                      className="mt-1"
                      value={String(values.documentNumber ?? "")}
                      onChange={(e) =>
                        set(
                          "documentNumber",
                          maskDocument(
                            e.target.value,
                            values.documentType === "CNPJ" ? "CNPJ" : "CPF"
                          )
                        )
                      }
                      onBlur={() => validateField("documentNumber")}
                    />
                    <FieldError message={errors.documentNumber} />
                  </div>
                  {values.documentType === "CNPJ" && (
                    <div className="sm:col-span-2">
                      <Label htmlFor="ongTradeName" required>
                        Nome fantasia / nome público da ONG
                      </Label>
                      <Input
                        id="ongTradeName"
                        className="mt-1"
                        value={String(values.tradeName ?? "")}
                        onChange={(e) => set("tradeName", e.target.value)}
                        onBlur={() => validateField("tradeName")}
                      />
                      <FieldError message={errors.tradeName} />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="responsible" required>
                      Responsável
                    </Label>
                    <Input id="responsible" className="mt-1" value={String(values.responsible ?? "")} onChange={(e) => set("responsible", e.target.value)} />
                    <FieldError message={errors.responsible} />
                  </div>
                  <div>
                    <Label htmlFor="animalCapacity">Capacidade de animais</Label>
                    <Input id="animalCapacity" type="number" min={0} className="mt-1" value={String(values.animalCapacity ?? 0)} onChange={(e) => set("animalCapacity", e.target.value)} />
                  </div>
                </div>
                <RegistrationAddressField address={address} onChange={setAddress} errors={errors} />
                <div>
                  <Label required>Tipo de atuação</Label>
                  <MultiCheckbox
                    options={ONG_ACTION_TYPES}
                    selected={(values.actionTypes as string[]) ?? []}
                    onChange={(v) => set("actionTypes", v)}
                    error={errors.actionTypes}
                  />
                </div>
                <YesNoToggle label="Aceita doações" value={Boolean(values.acceptsDonations)} onChange={(v) => set("acceptsDonations", v)} />
                <DocumentUpload documents={(values.documents as { name: string }[]) ?? []} onChange={(d) => set("documents", d)} />
              </>
            )}
          </div>

          {/* Termos */}
          <div className="space-y-3 border-t border-ecopet-gray/10 pt-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(values.acceptTerms)}
                onChange={(e) => set("acceptTerms", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded"
              />
              <span>
                {t("auth.register.terms.acceptTerms")}{" "}
                <Link href="/termos-de-uso" target="_blank" rel="noopener noreferrer" className="font-medium text-ecopet-green hover:underline">
                  {t("auth.register.terms.termsOfUse")}
                </Link>
              </span>
            </label>
            <FieldError message={errors.acceptTerms} />
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(values.acceptLgpd)}
                onChange={(e) => set("acceptLgpd", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded"
              />
              <span>
                {t("auth.register.terms.acceptPrivacy")}{" "}
                <Link href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="font-medium text-ecopet-green hover:underline">
                  {t("auth.register.terms.privacyPolicy")}
                </Link>
              </span>
            </label>
            <FieldError message={errors.acceptLgpd} />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t("auth.register.submitting")}
              </>
            ) : (
              t("auth.register.submit")
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ecopet-gray">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-ecopet-green hover:underline">
            {t("auth.login.submit")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
