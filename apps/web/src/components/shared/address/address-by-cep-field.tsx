"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatCepDisplay,
  isValidCepFormat,
  lookupCep,
  mergeAddress,
  normalizeCep,
} from "@/lib/address/cep-service";
import type { AddressByCepValue } from "@/lib/address/types";
import { BRAZILIAN_STATES } from "@/lib/registration/personas";

export type { AddressByCepValue };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export interface AddressByCepFieldProps {
  value: AddressByCepValue;
  onChange: (value: AddressByCepValue) => void;
  errors?: Record<string, string>;
  idPrefix?: string;
  title?: string;
  className?: string;
  showReference?: boolean;
  variant?: "default" | "compact" | "plain" | "bootstrap";
}

export function AddressByCepField({
  value,
  onChange,
  errors = {},
  idPrefix = "addr",
  title = "Endereço",
  className,
  showReference = true,
  variant = "default",
}: AddressByCepFieldProps) {
  const [loading, setLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);
  const lastFetched = useRef<string>("");
  const valueRef = useRef(value);
  valueRef.current = value;

  const patch = useCallback(
    (p: Partial<AddressByCepValue>) => onChange(mergeAddress(valueRef.current, p)),
    [onChange]
  );

  const runLookup = useCallback(async (cep: string) => {
    const normalized = normalizeCep(cep);
    if (!isValidCepFormat(normalized) || normalized === lastFetched.current) return;

    setLoading(true);
    setCepMessage(null);
    try {
      const result = await lookupCep(normalized);
      lastFetched.current = normalized;
      if (result.ok && result.address) {
        const current = valueRef.current;
        patch({
          zipCode: formatCepDisplay(normalized),
          street: result.address.street ?? current.street,
          district: result.address.district ?? current.district,
          city: result.address.city ?? current.city,
          state: result.address.state ?? current.state,
          complement: result.address.complement || current.complement,
          latitude: result.address.latitude ?? current.latitude ?? null,
          longitude: result.address.longitude ?? current.longitude ?? null,
        });
        setCepMessage(null);
      } else {
        setCepMessage(result.error ?? "CEP não encontrado.");
      }
    } finally {
      setLoading(false);
    }
  }, [patch]);

  useEffect(() => {
    const normalized = normalizeCep(value.zipCode);
    if (isValidCepFormat(normalized)) {
      void runLookup(normalized);
    }
  }, [value.zipCode, runLookup]);

  function handleCepChange(raw: string) {
    const formatted = formatCepDisplay(raw);
    patch({ zipCode: formatted });
    if (!isValidCepFormat(formatted)) {
      setCepMessage(null);
      if (normalizeCep(formatted).length < 8) lastFetched.current = "";
    }
  }

  const isBootstrap = variant === "bootstrap";
  const inputClass = isBootstrap ? "form-control mt-1" : "mt-1";
  const labelClass = isBootstrap ? "form-label" : "text-sm font-medium";
  const selectClass = isBootstrap
    ? "form-select mt-1"
    : "mt-1 flex h-11 w-full rounded-xl border border-ecopet-gray/20 px-4 text-sm dark:bg-ecopet-dark-card";

  const wrapperClass =
    variant === "compact" || variant === "plain" || variant === "bootstrap"
      ? cn(isBootstrap ? "row g-3" : "space-y-3", className)
      : cn("space-y-3 rounded-xl border border-ecopet-gray/10 bg-ecopet-gray/5 p-4", className);

  const col = (cls: string, children: React.ReactNode) =>
    isBootstrap ? <div className={cls}>{children}</div> : children;

  return (
    <div className={wrapperClass}>
      {title && !isBootstrap && (
        <p className="flex items-center gap-2 text-sm font-semibold text-ecopet-dark">
          <MapPin className="h-4 w-4 text-ecopet-green" />
          {title}
        </p>
      )}
      {title && isBootstrap && (
        <div className="col-12">
          <h6 className="fw-bold mb-0" style={{ color: "#1a3a2a" }}>{title}</h6>
        </div>
      )}

      {col(isBootstrap ? "col-md-4" : "", (
        <div>
          <label htmlFor={`${idPrefix}-zipCode`} className={labelClass}>
            CEP {loading && <Loader2 className="ml-1 inline h-3.5 w-3.5 animate-spin text-ecopet-green" />}
          </label>
          {isBootstrap ? (
            <input
              id={`${idPrefix}-zipCode`}
              className={inputClass}
              placeholder="58000-000"
              value={value.zipCode}
              onChange={(e) => handleCepChange(e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          ) : (
            <Input
              id={`${idPrefix}-zipCode`}
              className={inputClass}
              placeholder="00000-000"
              value={value.zipCode}
              onChange={(e) => handleCepChange(e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          )}
          <FieldError message={errors.zipCode ?? errors["address.zipCode"]} />
          {cepMessage && !loading && <p className="mt-1 text-xs text-amber-600">{cepMessage}</p>}
        </div>
      ))}

      {col(isBootstrap ? "col-12" : "", (
        <div>
          <label htmlFor={`${idPrefix}-street`} className={labelClass}>
            Logradouro {!isBootstrap && <span className="text-red-500">*</span>}
          </label>
          {isBootstrap ? (
            <input id={`${idPrefix}-street`} className={inputClass} value={value.street} onChange={(e) => patch({ street: e.target.value })} placeholder="Rua, avenida..." />
          ) : (
            <Input id={`${idPrefix}-street`} className={inputClass} value={value.street} onChange={(e) => patch({ street: e.target.value })} placeholder="Rua, avenida..." />
          )}
          <FieldError message={errors.street ?? errors["address.street"]} />
        </div>
      ))}

      {isBootstrap ? (
        <>
          <div className="col-md-3">
            <label htmlFor={`${idPrefix}-number`} className={labelClass}>Número</label>
            <input id={`${idPrefix}-number`} className={inputClass} value={value.number} onChange={(e) => patch({ number: e.target.value })} />
          </div>
          <div className="col-md-5">
            <label htmlFor={`${idPrefix}-district`} className={labelClass}>Bairro</label>
            <input id={`${idPrefix}-district`} className={inputClass} value={value.district} onChange={(e) => patch({ district: e.target.value })} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-number`} className={labelClass}>Número</label>
            <Input id={`${idPrefix}-number`} className={inputClass} value={value.number} onChange={(e) => patch({ number: e.target.value })} placeholder="Nº" />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-district`} className={labelClass}>Bairro</label>
            <Input id={`${idPrefix}-district`} className={inputClass} value={value.district} onChange={(e) => patch({ district: e.target.value })} />
          </div>
        </div>
      )}

      {isBootstrap ? (
        <>
          <div className="col-md-8">
            <label htmlFor={`${idPrefix}-city`} className={labelClass}>Cidade</label>
            <input id={`${idPrefix}-city`} className={inputClass} value={value.city} onChange={(e) => patch({ city: e.target.value })} />
          </div>
          <div className="col-md-4">
            <label htmlFor={`${idPrefix}-state`} className={labelClass}>Estado</label>
            <select id={`${idPrefix}-state`} className={selectClass} value={value.state || "SP"} onChange={(e) => patch({ state: e.target.value })}>
              {BRAZILIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-city`} className={labelClass}>Cidade <span className="text-red-500">*</span></label>
            <Input id={`${idPrefix}-city`} className={inputClass} value={value.city} onChange={(e) => patch({ city: e.target.value })} />
            <FieldError message={errors.city ?? errors["address.city"]} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-state`} className={labelClass}>UF <span className="text-red-500">*</span></label>
            <select id={`${idPrefix}-state`} className={selectClass} value={value.state || "SP"} onChange={(e) => patch({ state: e.target.value })}>
              {BRAZILIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError message={errors.state ?? errors["address.state"]} />
          </div>
        </div>
      )}

      {col(isBootstrap ? "col-12" : "", (
        <div>
          <label htmlFor={`${idPrefix}-complement`} className={labelClass}>Complemento</label>
          {isBootstrap ? (
            <input id={`${idPrefix}-complement`} className={inputClass} value={value.complement ?? ""} onChange={(e) => patch({ complement: e.target.value })} />
          ) : (
            <Input id={`${idPrefix}-complement`} className={inputClass} value={value.complement ?? ""} onChange={(e) => patch({ complement: e.target.value })} placeholder="Apto, bloco, sala..." />
          )}
        </div>
      ))}

      {showReference && col(isBootstrap ? "col-12" : "", (
        <div>
          <label htmlFor={`${idPrefix}-reference`} className={labelClass}>Referência</label>
          {isBootstrap ? (
            <input id={`${idPrefix}-reference`} className={inputClass} value={value.reference ?? ""} onChange={(e) => patch({ reference: e.target.value })} />
          ) : (
            <Input id={`${idPrefix}-reference`} className={inputClass} value={value.reference ?? ""} onChange={(e) => patch({ reference: e.target.value })} placeholder="Ponto de referência para entrega" />
          )}
        </div>
      ))}

      {(value.latitude != null && value.longitude != null) && !isBootstrap && (
        <p className="text-[10px] text-ecopet-gray">
          Coordenadas: {value.latitude?.toFixed(5)}, {value.longitude?.toFixed(5)}
        </p>
      )}
    </div>
  );
}

export function toAddressValue(raw: Record<string, unknown>): AddressByCepValue {
  return {
    zipCode: String(raw.zipCode ?? ""),
    street: String(raw.street ?? ""),
    number: String(raw.number ?? ""),
    district: String(raw.district ?? ""),
    city: String(raw.city ?? ""),
    state: String(raw.state ?? "SP"),
    complement: String(raw.complement ?? ""),
    reference: String(raw.reference ?? ""),
    latitude: typeof raw.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw.longitude === "number" ? raw.longitude : null,
  };
}
