import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

export type PhoneCountryOption = {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

export const FEATURED_COUNTRY_CODES: CountryCode[] = ["BR", "US", "PT", "GB"];

const displayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["pt-BR"], { type: "region" })
    : null;

export function countryFlag(code: CountryCode): string {
  const cc = code.toUpperCase();
  if (cc.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...cc].map((char) => 127397 + char.charCodeAt(0)));
}

function countryName(code: CountryCode): string {
  return displayNames?.of(code) ?? code;
}

export function buildPhoneCountryOption(code: CountryCode): PhoneCountryOption {
  return {
    code,
    name: countryName(code),
    callingCode: getCountryCallingCode(code),
    flag: countryFlag(code),
  };
}

let cachedCountries: PhoneCountryOption[] | null = null;

export function getAllPhoneCountries(): PhoneCountryOption[] {
  if (cachedCountries) return cachedCountries;

  cachedCountries = getCountries()
    .map(buildPhoneCountryOption)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return cachedCountries;
}

export function getFeaturedPhoneCountries(): PhoneCountryOption[] {
  return FEATURED_COUNTRY_CODES.map(buildPhoneCountryOption);
}

export function findPhoneCountry(code: CountryCode): PhoneCountryOption {
  return buildPhoneCountryOption(code);
}

export function searchPhoneCountries(query: string): PhoneCountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return getAllPhoneCountries();

  return getAllPhoneCountries().filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.callingCode.includes(q.replace(/\D/g, "")) ||
      `+${c.callingCode}`.includes(q)
  );
}

export function applyCountryCallingCode(
  currentValue: string,
  country: CountryCode
): string {
  const callingCode = getCountryCallingCode(country);
  const sanitized = currentValue.replace(/[^\d+\s().-]/g, "").trim();

  if (!sanitized) return `+${callingCode} `;

  if (sanitized.startsWith("+")) {
    const withoutPlus = sanitized.slice(1).replace(/\D/g, "");
    const national = withoutPlus.startsWith(callingCode)
      ? withoutPlus.slice(callingCode.length)
      : withoutPlus;
    return national ? `+${callingCode} ${national}` : `+${callingCode} `;
  }

  return `+${callingCode} ${sanitized.replace(/\D/g, "")}`;
}
