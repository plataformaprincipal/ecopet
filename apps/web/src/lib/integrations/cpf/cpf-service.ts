import { onlyDigits, validateCpfChecksum } from "@/schemas/validation/documents-shared";
import { normalizeFullName } from "@/lib/validation/full-name";

export const CPF_NAME_MISMATCH_MESSAGE = "O CPF informado não corresponde ao nome informado.";

export type CpfLookupResult = {
  /** Integração externa disponível (Serpro, Receita, etc.) */
  configured: boolean;
  valid: boolean;
  /** null = integração indisponível; true/false = resultado da consulta futura */
  nameMatch: boolean | null;
  registeredName?: string;
  message?: string;
};

/**
 * Arquitetura preparada para integração futura de validação CPF × nome.
 * Hoje: valida checksum localmente e não bloqueia cadastro.
 */
export async function lookupCpf(cpf: string, name: string): Promise<CpfLookupResult> {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11 || !validateCpfChecksum(digits)) {
    return { configured: false, valid: false, nameMatch: null, message: "Digite um CPF válido." };
  }

  const normalizedName = normalizeFullName(name);
  if (normalizedName.split(/\s+/).length < 2) {
    return { configured: false, valid: true, nameMatch: null };
  }

  const integrationEnabled = process.env.CPF_LOOKUP_ENABLED === "1";
  if (!integrationEnabled) {
    return {
      configured: false,
      valid: true,
      nameMatch: null,
      message: "Validação de CPF preparada — consulta externa será habilitada em breve.",
    };
  }

  // Ponto de extensão: substituir por Serpro / parceiro de KYC
  return { configured: true, valid: true, nameMatch: null };
}
