"use client";

import { useEffect, useState } from "react";
import { onlyDigits, validateCpfChecksum, validateCnpjChecksum } from "@/schemas/validation/documents-shared";
import type { DocumentKind } from "@/lib/registration/document-availability";

export type DocumentAvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useDocumentAvailability(type: DocumentKind, value: string) {
  const [status, setStatus] = useState<DocumentAvailabilityStatus>("idle");

  useEffect(() => {
    const digits = onlyDigits(value);
    const valid =
      type === "cpf"
        ? digits.length === 11 && validateCpfChecksum(digits)
        : digits.length === 14 && validateCnpjChecksum(digits);

    if (!valid) {
      setStatus(digits.length > 0 ? "invalid" : "idle");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/auth/check-document?type=${type}&value=${encodeURIComponent(digits)}`
          );
          const data = await res.json();
          if (!res.ok || data.success === false) {
            setStatus("invalid");
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
