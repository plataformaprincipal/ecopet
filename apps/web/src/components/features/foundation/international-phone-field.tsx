"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PHONE_EXAMPLES,
  PHONE_INVALID_MESSAGE,
  sanitizePhoneInput,
  getPhoneLiveFeedback,
} from "@/lib/validation/international-phone";
import {
  BRAZIL_DDD_OPTIONS,
  maskBrazilNationalNumber,
} from "@/lib/validation/brazil-phone";
import {
  applyCountryCallingCode,
  findPhoneCountry,
  getAllPhoneCountries,
  getFeaturedPhoneCountries,
  searchPhoneCountries,
  type PhoneCountryOption,
} from "@/lib/validation/phone-countries";

type InternationalPhoneFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  brazilDdd?: string;
  onBrazilDddChange?: (ddd: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
};

export function InternationalPhoneField({
  id,
  label = "Telefone",
  value,
  onChange,
  country,
  onCountryChange,
  brazilDdd = "",
  onBrazilDddChange,
  required,
  error,
  className,
}: InternationalPhoneFieldProps) {
  const listboxId = useId();
  const searchId = useId();
  const dddId = `${id}-ddd`;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isBrazil = country === "BR";
  const selectedCountry = useMemo(() => findPhoneCountry(country), [country]);
  const liveFeedback = useMemo(
    () => getPhoneLiveFeedback(value, country, isBrazil ? brazilDdd : undefined),
    [value, country, brazilDdd, isBrazil]
  );
  const showLiveError =
    (isBrazil ? brazilDdd || value.trim().length > 0 : value.trim().length > 0) && !liveFeedback.valid;
  const showLiveSuccess = liveFeedback.valid;
  const displayError = error ?? (showLiveError ? liveFeedback.message : undefined);
  const statusId = `${id}-status`;
  const examplesId = `${id}-examples`;
  const describedBy =
    [displayError ? statusId : null, showLiveSuccess ? statusId : null, examplesId, isBrazil ? `${dddId}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const filteredCountries = useMemo(() => searchPhoneCountries(search), [search]);
  const featuredCountries = useMemo(() => getFeaturedPhoneCountries(), []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCountry(option: PhoneCountryOption) {
    onCountryChange(option.code);
    if (option.code === "BR") {
      onChange("");
      onBrazilDddChange?.("");
    } else {
      onChange(applyCountryCallingCode(value, option.code));
      onBrazilDddChange?.("");
    }
    setOpen(false);
    setSearch("");
  }

  function renderCountryButton(option: PhoneCountryOption) {
    const selected = option.code === country;
    return (
      <button
        key={option.code}
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => selectCountry(option)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
          "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
          selected && "bg-emerald-50 font-medium dark:bg-emerald-950/40"
        )}
      >
        <span className="text-lg leading-none" aria-hidden>
          {option.flag}
        </span>
        <span className="min-w-0 flex-1 truncate">{option.name}</span>
        <span className="shrink-0 text-muted-foreground">+{option.callingCode}</span>
      </button>
    );
  }

  return (
    <div className={cn("w-full min-w-0", className)} ref={containerRef}>
      <label htmlFor={isBrazil ? dddId : id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>

      <div
        className={cn(
          "mt-1 grid min-w-0 gap-2",
          isBrazil ? "sm:grid-cols-[minmax(9rem,11.5rem)_minmax(5.5rem,7rem)_1fr]" : "sm:grid-cols-[minmax(9rem,11.5rem)_1fr]"
        )}
      >
        <div className="relative min-w-0">
          <button
            type="button"
            id={`${id}-country`}
            aria-label={`País do telefone, selecionado ${selectedCountry.name}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm",
              "transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-lg leading-none" aria-hidden>
                {selectedCountry.flag}
              </span>
              <span className="truncate">{isBrazil ? "Brasil" : selectedCountry.name}</span>
              <span className="shrink-0 text-muted-foreground">(+{selectedCountry.callingCode})</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
          </button>

          {open && (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Selecionar país"
              className="absolute z-50 mt-1 w-full min-w-[16rem] rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-ecopet-dark-card sm:min-w-[18rem]"
            >
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  ref={searchRef}
                  id={searchId}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar país ou DDI"
                  className="h-9 pl-8 pr-8"
                  aria-label="Buscar país"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!search && (
                <div className="mb-2 border-b border-gray-100 pb-2 dark:border-white/10">
                  <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Destaques</p>
                  <div className="space-y-0.5">{featuredCountries.map(renderCountryButton)}</div>
                </div>
              )}

              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                {!search && (
                  <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Todos os países</p>
                )}
                {(search ? filteredCountries : getAllPhoneCountries()).map(renderCountryButton)}
                {search && filteredCountries.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum país encontrado.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {isBrazil && (
          <div className="min-w-0">
            <label htmlFor={dddId} className="sr-only">
              DDD
            </label>
            <select
              id={dddId}
              value={brazilDdd}
              onChange={(e) => onBrazilDddChange?.(e.target.value)}
              required={required}
              aria-label="DDD brasileiro"
              aria-invalid={!!displayError && !brazilDdd}
              aria-describedby={`${dddId}-hint`}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                !brazilDdd && displayError && "border-red-500"
              )}
            >
              <option value="">DDD</option>
              {BRAZIL_DDD_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p id={`${dddId}-hint`} className="sr-only">
              Selecione o DDD da sua região.
            </p>
          </div>
        )}

        <div className="min-w-0">
          <Input
            id={id}
            type="tel"
            value={value}
            onChange={(e) =>
              onChange(isBrazil ? maskBrazilNationalNumber(e.target.value) : sanitizePhoneInput(e.target.value))
            }
            placeholder={
              isBrazil
                ? "99938-2221 ou 3333-4444"
                : "Digite seu telefone (com código do país, se necessário)"
            }
            required={required}
            autoComplete="tel"
            inputMode="tel"
            aria-label={isBrazil ? "Número de telefone brasileiro" : label}
            aria-invalid={!!displayError}
            aria-describedby={describedBy}
            className={cn(
              displayError && "border-red-500",
              showLiveSuccess && !displayError && "border-green-500"
            )}
          />
          {isBrazil && (
            <p className="mt-1 text-xs text-muted-foreground">
              Celular: 99938-2221 · Fixo: 3333-4444
            </p>
          )}
        </div>
      </div>

      <ul id={examplesId} className="mt-2 space-y-0.5 text-xs text-muted-foreground" aria-label="Exemplos de telefone">
        {PHONE_EXAMPLES.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>

      {(displayError || showLiveSuccess) && (
        <p
          id={statusId}
          className={cn(
            "mt-2 flex items-center gap-1 text-sm",
            displayError && "text-red-600",
            showLiveSuccess && !displayError && "text-green-700"
          )}
          role={displayError ? "alert" : "status"}
          aria-live="polite"
        >
          {showLiveSuccess && !displayError ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden /> ✓ {liveFeedback.message}
            </>
          ) : (
            <>✗ {displayError ?? PHONE_INVALID_MESSAGE}</>
          )}
        </p>
      )}
    </div>
  );
}
