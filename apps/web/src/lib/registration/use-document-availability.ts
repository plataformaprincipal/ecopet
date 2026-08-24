"use client";

import { useEffect, useState } from "react";
import {
  onlyDigits,
  validateCpfChecksum,
  inspectCnpjInput,
  normalizeCnpj,
} from "@/schemas/validation/documents-shared";
import type { DocumentKind } from "@/lib/registration/document-availability";

export type DocumentAvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useDocumentAvailability(type: DocumentKind, value: string) {
  const [status, setStatus] = useState<DocumentAvailabilityStatus>("idle");

  useEffect(() => {
    const valid =
      type === "cpf"
        ? (() => {
            const digits = onlyDigits(value);
            return digits.length === 11 && validateCpfChecksum(digits);
          })()
        : inspectCnpjInput(value) === "ok";

    if (!valid) {
      setStatus("idle");
      return;
    }

    const queryValue = type === "cpf" ? onlyDigits(value) : normalizeCnpj(value);
    setStatus("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/auth/check-document?type=${type}&value=${encodeURIComponent(queryValue)}`
          );
          const data = await res.json();
          if (!res.ok || data.success === false) {
            setStatus("idle");
            return;
          }
          setStatus(data.data?.available ? "available" : "taken");
        } catch {
          setStatus("idle");
        }
      })();
    }, 400);

    return () => clearTimeout(timer);
  }, [type, value]);

  return status;
}
