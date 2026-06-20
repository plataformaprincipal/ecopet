import { onlyDigits } from "@/schemas/validation/documents-shared";

export const BR_PHONE_INVALID_MESSAGE = "Digite um telefone brasileiro válido.";
export const BR_DDD_REQUIRED_MESSAGE = "Selecione o DDD.";
export const BR_PHONE_VALID_MESSAGE = "Telefone brasileiro válido.";

/** DDDs válidos no Brasil (ANATEL) com UF/região. */
export const BRAZIL_DDD_OPTIONS = [
  { code: "11", label: "11 — São Paulo/SP" },
  { code: "12", label: "12 — São Paulo/SP" },
  { code: "13", label: "13 — São Paulo/SP" },
  { code: "14", label: "14 — São Paulo/SP" },
  { code: "15", label: "15 — São Paulo/SP" },
  { code: "16", label: "16 — São Paulo/SP" },
  { code: "17", label: "17 — São Paulo/SP" },
  { code: "18", label: "18 — São Paulo/SP" },
  { code: "19", label: "19 — São Paulo/SP" },
  { code: "21", label: "21 — Rio de Janeiro/RJ" },
  { code: "22", label: "22 — Rio de Janeiro/RJ" },
  { code: "24", label: "24 — Rio de Janeiro/RJ" },
  { code: "27", label: "27 — Espírito Santo/ES" },
  { code: "28", label: "28 — Espírito Santo/ES" },
  { code: "31", label: "31 — Minas Gerais/MG" },
  { code: "32", label: "32 — Minas Gerais/MG" },
  { code: "33", label: "33 — Minas Gerais/MG" },
  { code: "34", label: "34 — Minas Gerais/MG" },
  { code: "35", label: "35 — Minas Gerais/MG" },
  { code: "37", label: "37 — Minas Gerais/MG" },
  { code: "38", label: "38 — Minas Gerais/MG" },
  { code: "41", label: "41 — Paraná/PR" },
  { code: "42", label: "42 — Paraná/PR" },
  { code: "43", label: "43 — Paraná/PR" },
  { code: "44", label: "44 — Paraná/PR" },
  { code: "45", label: "45 — Paraná/PR" },
  { code: "46", label: "46 — Paraná/PR" },
  { code: "47", label: "47 — Santa Catarina/SC" },
  { code: "48", label: "48 — Santa Catarina/SC" },
  { code: "49", label: "49 — Santa Catarina/SC" },
  { code: "51", label: "51 — Rio Grande do Sul/RS" },
  { code: "53", label: "53 — Rio Grande do Sul/RS" },
  { code: "54", label: "54 — Rio Grande do Sul/RS" },
  { code: "55", label: "55 — Rio Grande do Sul/RS" },
  { code: "61", label: "61 — Distrito Federal/DF" },
  { code: "62", label: "62 — Goiás/GO" },
  { code: "64", label: "64 — Goiás/GO" },
  { code: "63", label: "63 — Tocantins/TO" },
  { code: "65", label: "65 — Mato Grosso/MT" },
  { code: "66", label: "66 — Mato Grosso/MT" },
  { code: "67", label: "67 — Mato Grosso do Sul/MS" },
  { code: "68", label: "68 — Acre/AC" },
  { code: "69", label: "69 — Rondônia/RO" },
  { code: "71", label: "71 — Bahia/BA" },
  { code: "73", label: "73 — Bahia/BA" },
  { code: "74", label: "74 — Bahia/BA" },
  { code: "75", label: "75 — Bahia/BA" },
  { code: "77", label: "77 — Bahia/BA" },
  { code: "79", label: "79 — Sergipe/SE" },
  { code: "81", label: "81 — Pernambuco/PE" },
  { code: "87", label: "87 — Pernambuco/PE" },
  { code: "82", label: "82 — Alagoas/AL" },
  { code: "83", label: "83 — Paraíba/PB" },
  { code: "84", label: "84 — Rio Grande do Norte/RN" },
  { code: "85", label: "85 — Ceará/CE" },
  { code: "88", label: "88 — Ceará/CE" },
  { code: "86", label: "86 — Piauí/PI" },
  { code: "89", label: "89 — Piauí/PI" },
  { code: "91", label: "91 — Pará/PA" },
  { code: "93", label: "93 — Pará/PA" },
  { code: "94", label: "94 — Pará/PA" },
  { code: "92", label: "92 — Amazonas/AM" },
  { code: "97", label: "97 — Amazonas/AM" },
  { code: "95", label: "95 — Roraima/RR" },
  { code: "96", label: "96 — Amapá/AP" },
  { code: "98", label: "98 — Maranhão/MA" },
  { code: "99", label: "99 — Maranhão/MA" },
] as const;

export const VALID_BRAZIL_DDD = new Set<string>(BRAZIL_DDD_OPTIONS.map((o) => o.code));

const FAKE_SUBSCRIBER_SEQUENCES = new Set([
  "000000000",
  "111111111",
  "999999999",
  "123456789",
  "00000000",
  "11111111",
  "99999999",
  "12345678",
]);

function isFakeSubscriberNumber(digits: string): boolean {
  if (FAKE_SUBSCRIBER_SEQUENCES.has(digits)) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  return false;
}

/** Máscara do número nacional BR (sem DDD): celular 99938-2221 ou fixo 3333-4444. */
export function maskBrazilNationalNumber(value: string): string {
  const d = onlyDigits(value).slice(0, 9);
  if (d.length === 0) return "";
  if (d[0] === "9") {
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

export function isValidBrazilNationalNumber(ddd: string, national: string): boolean {
  if (!VALID_BRAZIL_DDD.has(ddd)) return false;

  const subscriber = onlyDigits(national);
  if (subscriber.length === 9 && subscriber[0] === "9") {
    return !isFakeSubscriberNumber(subscriber);
  }
  if (subscriber.length === 8 && /^[2-5]/.test(subscriber)) {
    return !isFakeSubscriberNumber(subscriber);
  }
  return false;
}

export function composeBrazilPhoneE164(ddd: string, national: string): string {
  return `+55${ddd}${onlyDigits(national)}`;
}

export function normalizeBrazilPhoneE164(ddd: string, national: string): string | null {
  if (!isValidBrazilNationalNumber(ddd, national)) return null;
  return composeBrazilPhoneE164(ddd, national);
}

/** Valida telefone brasileiro já em E.164 (+55...). */
export function isValidBrazilPhoneE164(value: string): boolean {
  const digits = onlyDigits(value);
  if (!digits.startsWith("55")) return false;

  const national = digits.slice(2);
  if (national.length !== 10 && national.length !== 11) return false;

  const ddd = national.slice(0, 2);
  const subscriber = national.slice(2);
  return isValidBrazilNationalNumber(ddd, subscriber);
}

export function normalizeBrazilPhoneFromE164(value: string): string | null {
  if (!isValidBrazilPhoneE164(value)) return null;
  return `+${onlyDigits(value)}`;
}
